import { createAxiosHttpClient } from '@api-sdk-creator/axios-http-client';
import {
    ApiTokenType,
    ChallengeResponseType,
    createCustomerSDK,
    createMerchantSDK,
    WPayCustomerApi,
    WPayCustomerOptions,
} from '@wpay/sdk';
import * as frames from '@wpay/frames';
import * as Axios from 'axios';

const secondsSinceEpoch = Math.round(Date.now() / 1000);
const baseUrl = 'https://dev.mobile-api.woolworths.com.au/wow/v1';

const apiKey = 'haTdoUWVhnXm5n75u6d0VG67vCCvKjQC';
const merchantId = '10006';
const framesApiBaseUrl = `${baseUrl}/pay/instore`;
const walletApiBaseUrl = 'https://dev-api.wpay.com.au/wow/v1/pay';

let authorizationToken: ApiTokenType = '';
let action: any;
let customerSDK: WPayCustomerApi;
let tokenizedInstrument: any;
let submitCardBtn: HTMLButtonElement;
let makePaymentBtn: HTMLButtonElement;
let paymentRequestId: string;

//Instantiate the frames SDK, this will allow us to capture user card infromation.
const framesSDK = new frames.ElementsSDK(
    apiKey,
    `Bearer ${authorizationToken}`,
    framesApiBaseUrl,
    frames.LogLevel.DEBUG
);

window.onload = async () => {
    await createPaymentRequest();

    //Instantiate the customer API
    const options: WPayCustomerOptions = {
        apiKey: apiKey,
        baseUrl: walletApiBaseUrl,
        accessToken: authorizationToken,
    };
    customerSDK = createCustomerSDK(createAxiosHttpClient, options);

    // Once the page has loaded, initialise a new card capture action.
    action = framesSDK.createAction(frames.ActionTypes.CaptureCard);
    await action.start();

    // Populate the placeholder div with the card capture inputs. In this case we
    // are using the 'CardGroup'
    action.createElement('CardGroup', 'cardCapturePlaceholder');

    submitCardBtn = document.getElementById('submitCard') as HTMLButtonElement;
    makePaymentBtn = document.getElementById(
        'makePayment'
    ) as HTMLButtonElement;

    submitCardBtn.onclick = captureCard;
    makePaymentBtn.onclick = makePayment;
};

async function captureCard() {
    //Capture the card inputted by the user
    try {
        //Submit the card capture inputs for tokenization
        await action.submit();
        const completeResponse = await action.complete();

        if (completeResponse.data.paymentInstrument) {
            //A new instrument has been tokenized
            tokenizedInstrument = {
                paymentInstrumentId:
                    completeResponse.data.paymentInstrument.itemId,
                stepUpToken: completeResponse.data.stepUpToken,
            };
        } else {
            //The instrument was already found to exist
            tokenizedInstrument = {
                paymentInstrumentId: completeResponse.data.itemId,
                stepUpToken: completeResponse.data.stepUpToken,
            };
        }

        // Display the payment section
        submitCardBtn.disabled = true;
        document.getElementById('instrumentIdDisplay')!.innerText =
            tokenizedInstrument.paymentInstrumentId;
        displaySection('paymentSection');
        console.log('Instrument details: ', tokenizedInstrument);
    } catch (error) {
        console.log('Error during card capture: ', error);
    }
}

async function makePayment() {
    //Make the payment using the instrument captured in the previous step
    if (!tokenizedInstrument)
        throw new Error('No payment instrument to charge');

    try {
        makePaymentBtn.disabled = true;
        // To make the payment we need to submit the ID of the payment request,
        // the ID of the instrument we've just tokenized and if required the step-up
        // token of the for the instrument
        const response = await customerSDK.paymentRequests.makePayment(
            paymentRequestId,
            tokenizedInstrument.paymentInstrumentId,
            [],
            false,
            `JS-SDK-REF-${secondsSinceEpoch}`,
            undefined,
            [
                {
                    instrumentId: tokenizedInstrument.paymentInstrumentId,
                    token: tokenizedInstrument.stepUpToken,
                    type: ChallengeResponseType.STEP_UP,
                },
            ]
        );

        // Display the payment response in the final section of the page.
        document.getElementById('responseDisplay')!.innerText =
            JSON.stringify(response);
        displaySection('responseSection');
        console.log('Payment Response: ', response);
    } catch (error) {
        console.log('Error making payment: ', error);
        throw error;
    }
}

async function createPaymentRequest() {
    // As part of this example application we will instantiate the Merchant SDk and
    // create a payment request. In a normal application the client would should have
    // no need to use the Merchant SDK operations and the payment request should exist
    // before we come to the client making a payment.
    const merchantSDK = createMerchantSDK(createAxiosHttpClient, {
        apiKey: apiKey,
        baseUrl: walletApiBaseUrl,
        merchantId: merchantId,
    });

    try {
        const response = await merchantSDK.payments.createPaymentRequest({
            merchantReferenceId: `JS-SDK-REF-${secondsSinceEpoch}`,
            grossAmount: 100,
        });

        paymentRequestId = response.paymentRequestId;
        document.getElementById('paymentRequestDisplay')!.innerText =
            paymentRequestId;
    } catch (error) {
        console.log('Error during payment request creation: ', error);
        throw error;
    }
}

function displaySection(id: string) {
    const paymentSection = document.getElementById(id);
    paymentSection!.classList.add('show');
    paymentSection!.style.maxHeight = paymentSection!.scrollHeight + 'px';
}
