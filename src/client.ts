import { createAxiosHttpClient } from '@api-sdk-creator/axios-http-client';
import {
    ApiTokenType,
    ChallengeResponseType,
    createCustomerSDK,
    WPayCustomerApi,
    WPayCustomerOptions,
} from '@wpay/sdk';
import * as frames from '@wpay/frames';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);

let secondsSinceEpoch = Math.round(Date.now() / 1000);
const baseUrl = 'https://dev.mobile-api.woolworths.com.au/wow/v1';

const apiKey = 'ukUfDqw5A39a2rKIxCMVuNvg3IBA7oHv';
const framesApiBaseUrl = `${baseUrl}/pay/instore`;
const walletApiBaseUrl = 'https://dev-api.wpay.com.au/wow/v1/pay';

const codeExampleContent: any = {
    setupCardCapture: {
        heading: 'Capture Card',
        content: ['const framesSDK = new frames.ElementsSDK(',
        '\tapiKey,',
        '\t`Bearer ${authorizationToken}`,',
        '\tframesApiBaseUrl,',
        '\tframes.LogLevel.DEBUG,',
        ');\r\n',
        'action = framesSDK.createAction(frames.ActionTypes.CaptureCard);',
        'await action.start();',
        'action.createFramesControl("CardGroup", "cardCapturePlaceholder");']
    },
    setupCustomerSDK: {
        heading: 'Setup Customer SDK',
        content: ['const options: WPayCustomerOptions = {',
        '\tapiKey: apiKey,',
        '\tbaseUrl: walletApiBaseUrl,',
        '\taccessToken: authorizationToken,',
        '};\r\n',
        'customerSDK = createCustomerSDK(createAxiosHttpClient, options);\r\n']
    },
    setupPayment: {
        heading: 'Make Payment',
        content: ['const response = await customerSDK.paymentRequests.makeImmediatePayment({',
            '\t\tclientReference: \'<client-reference>\',',
            '\t\torderNumber: \'<order-number>\',',
            '\t\tpayments: [{',
            '\t\t\tpaymentInstrumentId: tokenizedInstrument.paymentInstrumentId,',
            '\t\t\tamount: 50',
            '\t\t}]',
            '\t},',
            '\t[{',
            '\t\tinstrumentId: tokenizedInstrument.paymentInstrumentId,',
            '\t\ttoken: tokenizedInstrument.stepUpToken,',
            '\t\ttype: ChallengeResponseType.STEP_UP',
            '\t}]',
            ');'
        ]            
    },
    setupPaymentPreauth: {
        heading: 'Make PreAuth Payment',
        content: ['const response = await customerSDK.paymentRequests.makeImmediatePayment({',
            '\t\tclientReference: \'<client-reference>\',',
            '\t\torderNumber: \'<order-number>\',',
            '\t\tpayments: [{',
            '\t\t\tpaymentInstrumentId: tokenizedInstrument.paymentInstrumentId,',
            '\t\t\tamount: 50',
            '\t\t}],',
            '\t\ttransactionType: { creditCard: \'PREAUTH\' }',
            '\t},',
            '\t[{',
            '\t\tinstrumentId: tokenizedInstrument.paymentInstrumentId,',
            '\t\ttoken: tokenizedInstrument.stepUpToken,',
            '\t\ttype: ChallengeResponseType.STEP_UP',
            '\t}]',
            ');'
        ]       
    },
    setupPaymentThreeDS: {
        heading: 'Make Payment with 3DS',
        content: ['const response = await customerSDK.paymentRequests.makeImmediatePayment({',
            '\t\tclientReference: \'<client-reference>\',',
            '\t\torderNumber: \'<order-number>\',',
            '\t\tpayments: [{',
            '\t\t\tpaymentInstrumentId: tokenizedInstrument.paymentInstrumentId,',
            '\t\t\tamount: 50',
            '\t\t}],',
            '\t\tmerchantPayload: {',
            '\t\t\tpayload: {',
            '\t\t\t\trequires3DS: true',
            '\t\t\t},',
            '\t\t\tschemaId: \'0a221353-b26c-4848-9a77-4a8bcbacf228\'',
            '\t\t}',
            '\t},',
            '\t[{',
            '\t\tinstrumentId: tokenizedInstrument.paymentInstrumentId,',
            '\t\ttoken: tokenizedInstrument.stepUpToken,',
            '\t\ttype: ChallengeResponseType.STEP_UP',
            '\t}]',
            ');'
        ]         
    },
    setupPaymentPreauthThreeDS: {
        heading: 'Make PreAuth Payment with 3DS',
        content: ['const response = await customerSDK.paymentRequests.makeImmediatePayment({',
            '\t\tclientReference: \'<client-reference>\',',
            '\t\torderNumber: \'<order-number>\',',
            '\t\tpayments: [{',
            '\t\t\tpaymentInstrumentId: tokenizedInstrument.paymentInstrumentId,',
            '\t\t\tamount: 50',
            '\t\t}],',
            '\t\ttransactionType: { creditCard: \'PREAUTH\' },',
            '\t\tmerchantPayload: {',
            '\t\t\tpayload: {',
            '\t\t\t\trequires3DS: true',
            '\t\t\t},',
            '\t\t\tschemaId: \'0a221353-b26c-4848-9a77-4a8bcbacf228\'',
            '\t\t}',
            '\t},',
            '\t[{',
            '\t\tinstrumentId: tokenizedInstrument.paymentInstrumentId,',
            '\t\ttoken: tokenizedInstrument.stepUpToken,',
            '\t\ttype: ChallengeResponseType.STEP_UP',
            '\t}]',
            ');'
        ]       
    }
}

let authorizationToken: ApiTokenType = '';
let action: any;
let customerSDK: WPayCustomerApi;
let tokenizedInstrument: any;
let submitCardBtn: HTMLButtonElement;
let makePaymentBtn: HTMLButtonElement;
let configPaymentBtn: HTMLButtonElement;
let configPreauthBtn: HTMLButtonElement;
let configThreeDsOnBtn: HTMLButtonElement;
let configThreeDsOffBtn: HTMLButtonElement;
let resetBtn: HTMLButtonElement;

let enableSaveButton = false;
const visitedStatus: any = {}
const configState: any = {
    preauth: false,
    threeDS: false,
    codeExampleView: 'cardCapture'
}

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
    updateCodeExamples(['setupCardCapture']);

    //Instantiate the customer API
    const options: WPayCustomerOptions = {
        apiKey: apiKey,
        baseUrl: walletApiBaseUrl,
        accessToken: authorizationToken,
        walletId: '4fa9e893-2fb9-4516-bfc5-6fa8cd903528'
    };
    customerSDK = createCustomerSDK(createAxiosHttpClient, options);

    // Once the page has loaded, initialise a new card capture action.
    action = framesSDK.createAction(frames.ActionTypes.CaptureCard);
    await action.start();

    // Populate the placeholder div with the card capture inputs. In this case we
    // are using the 'CardGroup'
    action.createFramesControl('CardGroup', 'cardCapturePlaceholder');
 
    // Add OnValidated Eventlistener which will cause the updateErrors
    // function to be called if a validation error is encountered in the
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

    submitCardBtn = document.getElementById('client-submitCard') as HTMLButtonElement;
    makePaymentBtn = document.getElementById('client-payment') as HTMLButtonElement;

    submitCardBtn.onclick = captureCard;
    makePaymentBtn.onclick = makeImmediatePayment;

    configPaymentBtn = document.getElementById('config-payment') as HTMLButtonElement;
    configPreauthBtn = document.getElementById('config-preauth') as HTMLButtonElement;
    configThreeDsOnBtn = document.getElementById('config-3dsOn') as HTMLButtonElement;
    configThreeDsOffBtn = document.getElementById('config-3dsOff') as HTMLButtonElement;
    resetBtn = document.getElementById('config-reset') as HTMLButtonElement;

    configPaymentBtn.onclick = updateConfigState({ preauth: false });
    configPreauthBtn.onclick = updateConfigState({ preauth: true });
    configThreeDsOnBtn.onclick = updateConfigState({ threeDS: true });
    configThreeDsOffBtn.onclick = updateConfigState({ threeDS: false });
    resetBtn.onclick = reset;

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
    (document.getElementById("client-submitCard")! as HTMLButtonElement).disabled = !enableSaveButton;
}

async function captureCard() {
    //Capture the card inputted by the user
    try {
        //Submit the card capture inputs for tokenization
        await action.submit();
        const completeResponse = await action.complete();

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
        displaySection('payment-panel');
        configState.codeExampleView = 'setupPayment';
        updateCodeExamples([
            'setupCustomerSDK',
            selectPaymentCodeExample('setupPayment')
        ]);
        console.log('Instrument details: ', tokenizedInstrument);
    } catch (error) {
        console.log('Error during card capture: ', error);
    }
}

async function makeImmediatePayment() {
    const basePaymentRequest = {
        clientReference: `JS-SDK-REF-${secondsSinceEpoch}`,
        orderNumber: `JS-SDK-REF-${secondsSinceEpoch}`,
        payments: [{
            paymentInstrumentId: tokenizedInstrument.paymentInstrumentId,
            amount: 50
        }]
    };

    const preauthTransaction = {
        transactionType: { creditCard: 'PREAUTH' }
    }

    const threeDSTransaction = {
        merchantPayload: {
            payload: {
                requires3DS: true
            },
            schemaId: "0a221353-b26c-4848-9a77-4a8bcbacf228"
        }
    }

    //Make the payment using the instrument captured in the previous step
    if (!tokenizedInstrument)
        throw new Error('No payment instrument to charge');

    try {
        makePaymentBtn.disabled = true;

        const response = await customerSDK.paymentRequests.makeImmediatePayment(
            {
                ...basePaymentRequest,
                ...(configState.preauth && preauthTransaction),
                ...(configState.threeDS && threeDSTransaction)
            },
            [
                {
                    instrumentId: tokenizedInstrument.paymentInstrumentId,
                    token: tokenizedInstrument.stepUpToken,
                    type: ChallengeResponseType.STEP_UP,
                },
            ]
        );

        const resultsPanel = document.getElementById('results-panel');
        const pre = document.createElement('pre');
        pre.classList.add('padding');
        let resultsContent = JSON.stringify(response, null, '  ');
        console.log('resultsContent', resultsContent);
        const text = document.createTextNode(resultsContent);

        pre.appendChild(text);
        resultsPanel!.appendChild(pre);
        hljs.highlightElement(pre);
        
        displaySection('results-panel');

        // Display the payment response in the final section of the page.
        console.log('Payment Response: ', response);
    } catch (error) {
        console.log('Error making payment: ', error);
        throw error;
    } finally {
        resetBtn.disabled = false;
    }
}

function displaySection(id: string) {
    const section = document.getElementById(id);
    section!.classList.add('show');
    section!.style.maxHeight = section!.scrollHeight + 'px';
}

function selectPaymentCodeExample(exampleName: string): string {
    let result = exampleName;
    if (configState.preauth) result += 'Preauth';

    if (configState.threeDS) result += 'ThreeDS';
    
    return result;
}

function updateCodeExamples(codeExamples: string[]) {
    const codePanel = document.getElementById('code-panel');
    //Remove any existing code examples
    codePanel!.innerHTML = '';

    codeExamples.forEach((name) => {
        const codeExample = codeExampleContent[name];
        const pre = document.createElement('pre');
        pre.className = "highlight";
        
        if (codeExample.heading) {
            const heading = document.createElement('h3');
            heading.innerText = codeExample.heading;
            codePanel!.appendChild(heading);
        }

        codeExample.content.forEach((value: string) => {
            const text = document.createTextNode(value + '\r\n');
            pre.appendChild(text);
        });

        codePanel!.appendChild(pre);
        hljs.highlightElement(pre);
    });
}

function updateConfigState(update: any) {
    return () => {
        if (update.preauth !== undefined && update.preauth !== configState.preauth) {
            configState.preauth = update.preauth;

            if (configState.preauth) {
                configPaymentBtn.classList.remove('selected');
                configPreauthBtn.classList.add('selected');
            } else {
                configPaymentBtn.classList.add('selected');
                configPreauthBtn.classList.remove('selected');
            }

            if(configState.codeExampleView === 'setupPayment') {
                updateCodeExamples([
                    'setupCustomerSDK',
                    selectPaymentCodeExample('setupPayment')
                ]);
            }
        }

        if (update.threeDS !== undefined && update.threeDS !== configState.threeDS) {
            configState.threeDS = update.threeDS;
            
            if (configState.threeDS) {
                configThreeDsOnBtn.classList.add('selected');
                configThreeDsOffBtn.classList.remove('selected');
            } else {
                configThreeDsOnBtn.classList.remove('selected');
                configThreeDsOffBtn.classList.add('selected');
            }

            if(configState.codeExampleView === 'setupPayment') {
                updateCodeExamples([
                    'setupCustomerSDK',
                    selectPaymentCodeExample('setupPayment')
                ]);
            }
        }
    }
}

function reset() {
    secondsSinceEpoch = Math.round(Date.now() / 1000);
    makePaymentBtn.disabled = false;
    const resultsPanel = document.getElementById('results-panel');
    resultsPanel!.classList.remove('show');
    resultsPanel!.removeAttribute('style');

    resultsPanel!.innerHTML = '';
    const responseHeading = document.createElement('h3');
    responseHeading.innerText = 'Response:'
    resultsPanel!.appendChild(responseHeading);
    resetBtn.disabled = true;
}
