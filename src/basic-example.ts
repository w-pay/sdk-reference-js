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
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);

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
let enableSaveButton = false;
const visitedStatus: any = {}

const errorMap: Map<string, string> = new Map([
    ['Card No. Required', 'Please enter a valid card number.'],
    ['Invalid Card No.', 'Please enter a valid card number.'],
    ['Invalid Expiry', 'Please enter a valid expiry.'],
    ['Incomplete Expiry', 'Please enter a valid expiry'],
    ['Expired card', 'The expiry entered is in the past. Please enter a valid expiry.'],
    ['Invalid CVV', 'Please enter a valid CVV.']
]);

//Instantiate the frames SDK, this will allow us to capture user card infromation.
const framesSDK = new frames.FramesSDK({
    apiKey: apiKey,
    authToken: `Bearer ${authorizationToken}`,
    apiBase: framesApiBaseUrl,
    logLevel: frames.LogLevel.DEBUG
});


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
    action = framesSDK.createAction(frames.ActionTypes.CaptureCard, { save: false });
    await action.start();

    // Populate the placeholder div with the card capture inputs. In this case we
    // are using the 'CardGroup'
    action.createFramesControl('CardGroup', 'cardCapturePlaceholder');
 
    // Add OnValidated Eventlistener which will cause the updateErrors
    // function to be called if a validation error is encoutned in the
    // frames SDK while entering a Credit Card details.
    document.getElementById('cardCapturePlaceholder')!
        .addEventListener(
            frames.FramesEventType.OnValidated,
            updateErrors
        );

    // Add OnFocus Eventlistener which is fired when a field is focused in the frames SDK.
    // This enables you to know if all fields have been visited and the credit card is ready
    // for submission.
    document.getElementById('cardCapturePlaceholder')!
        .addEventListener(
            frames.FramesEventType.OnFocus,
            setVisitedStatus
        );

    // Add OnBlur Eventlistener which is fired when a field is exited in the frames SDK.
    // This enables you to check for errors and visited fields to see if the credit card 
    // is ready for submission.
    document.getElementById('cardCapturePlaceholder')!
        .addEventListener(
            frames.FramesEventType.OnBlur,
            checkVisitedStatus
        );

    submitCardBtn = document.getElementById('submitCard') as HTMLButtonElement;
    makePaymentBtn = document.getElementById(
        'makePayment'
    ) as HTMLButtonElement;

    submitCardBtn.onclick = captureCard;
    makePaymentBtn.onclick = makePayment;
};

async function updateErrors() {
    const errors = action.errors();
    if (errors !== undefined && errors.length > 0) { 

        document.getElementById('cardCaptureErrors')!.innerHTML =
            `${errorMap.get(errors[0]) ? errors[0] + ' - ' + errorMap.get(errors[0]) : errors[0]}`;

    } else {
        document.getElementById('cardCaptureErrors')!.innerHTML = "";
    }
}

async function setVisitedStatus(event: any) {
    if (event && event.detail && event.detail.control) {
        visitedStatus[event.detail.control] = true;
        checkVisitedStatus();
    };
}

async function checkVisitedStatus() {
    const keys = [ 'cardNo', 'cardExpiry', 'cardCVV'];
    for (const key of keys) {
        if (!visitedStatus[key]) return;
    }
    if (action.errors() === undefined || action.errors().length === 0) {
        enableSaveButton = true;
    } else {
        enableSaveButton = false;
    }
    (document.getElementById("submitCard")! as HTMLButtonElement).disabled = !enableSaveButton;
}

async function captureCard() {
    //Capture the card inputted by the user
    try {
        //Submit the card capture inputs for tokenization
        await action.submit();
        const completeResponse = await action.complete();
        console.log('COmplete REsp: ', completeResponse);
        if (completeResponse.paymentInstrument) {
            //A new instrument has been tokenized
            tokenizedInstrument = {
                paymentInstrumentId:
                    completeResponse.paymentInstrument.itemId,
                stepUpToken: completeResponse.stepUpToken,
            };
        } else {
            //The instrument was already found to exist
            tokenizedInstrument = {
                paymentInstrumentId: completeResponse.itemId,
                stepUpToken: completeResponse.stepUpToken,
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
        const responseSection = document.getElementById('responseSection');
        const pre = document.createElement('pre');
        pre.classList.add('padding');
        let resultsContent = JSON.stringify(response, null, '  ');
        const text = document.createTextNode(resultsContent);

        pre.appendChild(text);
        responseSection!.appendChild(pre);
        hljs.highlightElement(pre);

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
