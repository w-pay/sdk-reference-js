import { createAxiosHttpClient } from '@api-sdk-creator/axios-http-client';
import {
    ApiTokenType,
    createMerchantSDK,
    WPayMerchantApi,
} from '@wpay/sdk';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);

const secondsSinceEpoch = Math.round(Date.now() / 1000);

const apiKey = 'ukUfDqw5A39a2rKIxCMVuNvg3IBA7oHv';
const merchantId = 'petculture';
const walletApiBaseUrl = 'https://dev-api.wpay.com.au/wow/v1/pay';

const codeExampleContent: any = {
    setupMerchantSDK: {
        heading: 'Setup Merchant SDK',
        content: ['merchantSDK = createMerchantSDK(createAxiosHttpClient, {',
        '\tapiKey: apiKey,',
        '\tbaseUrl: walletApiBaseUrl,',
        '\tmerchantId: merchantId,',
        '});\r\n']
    },
    getTransaction: {
        heading: 'Get Transaction',
        content: ['const response = await merchantSDK.transactions.getById(transactionId);']
    },
    refundTransaction: {
        heading: 'Refund Transaction',
        content: ['//Refund entire transaction',
            'const response = await merchantSDK.payments.refundTransaction(',
            '\ttransactionId,', 
            '\t{ reason: \'Customer has requested a refund\' }',
            ');',
            '\r\n//Refund partial transaction',
            'const response = await merchantSDK.payments.refundTransaction(',
            '\ttransactionId,', 
            '\t{', 
            '\t\treason: \'Customer has requested a refund\',',
            '\t\tsubTransactions: [',
            '\t\t\tsubTransactionRef: \'0000000000000000\',',
            '\t\t\tamount: 12.34',
            '\t\t]',
            '\t}',
            ');'
        ]         
    },
    completeTransaction: {
        heading: 'Complete Transaction',
        content: ['//Complete full transactions',
            'const response = await merchantSDK.payments.completeTransaction(',
            '\ttransactionId,', 
            '\t{', 
                '\t\torderNumber: \'<order-number>\',',
                '\t\tclientReference: \'<client-reference>\'',
            '\t}',
            ');',
            '\r\n//Complete partial transaction',
            'const response = await merchantSDK.payments.completeTransaction(',
            '\ttransactionId,', 
            '\t{',
                '\t\torderNumber: \'<order-number>\',',
                '\t\tclientReference: \'<client-reference>\'',
                '\t\tcompletions: [',
                    '\t\t\tpaymentTransactionRef: \'0000000000000000\',',
                    '\t\t\tamount: 12.34',
                '\t\t]',
            '\t}',
            ');'
        ]       
    },
    voidTransaction: {
        heading: 'Void Transaction',
        content: ['const response = await merchantSDK.payments.voidTransaction(',
            '\ttransactionId,', 
            '\t{', 
                '\t\torderNumber: \'<order-number>\',',
                '\t\tclientReference: \'<client-reference>\'',
            '\t}',
            ');',
            '\r\n//Void partial transaction',
            'const response = await merchantSDK.payments.voidTransaction(',
            '\ttransactionId,', 
            '\t{',
                '\t\torderNumber: \'<order-number>\',',
                '\t\tclientReference: \'<client-reference>\'',
                '\t\tvoids: [',
                    '\t\t\tpaymentTransactionRef: \'0000000000000000\'',
                '\t\t]',
            '\t}',
            ');'
        ]              
    }
}

let authorizationToken: ApiTokenType = '';
let merchantSDK: WPayMerchantApi;

let searchTxnBtn: HTMLButtonElement;
let refundTxnBtn: HTMLButtonElement;
let completeTxnBtn: HTMLButtonElement;
let voidTxnBtn: HTMLButtonElement;

let transactionId: string;

window.onload = async () => {
    updateCodeExamples(['setupMerchantSDK', 'getTransaction']);

    //Instantiate the merchant API
    merchantSDK = createMerchantSDK(createAxiosHttpClient, {
        apiKey: apiKey,
        baseUrl: walletApiBaseUrl,
        merchantId: merchantId,
        accessToken: authorizationToken
    });

    searchTxnBtn = document.getElementById('merchant-searchTxn') as HTMLButtonElement;
    refundTxnBtn = document.getElementById('merchant-refundTxn') as HTMLButtonElement;
    completeTxnBtn = document.getElementById('merchant-completeTxn') as HTMLButtonElement;
    voidTxnBtn = document.getElementById('merchant-voidTxn') as HTMLButtonElement;

    searchTxnBtn.onclick = searchTransaction;
    refundTxnBtn.onclick = refundTransaction;
    completeTxnBtn.onclick = completeTransaction;
    voidTxnBtn.onclick = voidTransaction;
};

async function searchTransaction() {
    reset();
    const transactionIdElem: HTMLInputElement = document.getElementById('transaction-id-input') as HTMLInputElement;
    transactionId = transactionIdElem.value;

    if (!transactionId || transactionId === '') {
        searchTxnBtn.disabled = false;
        return;
    }

    try {
        const response = await merchantSDK.transactions.getById(transactionId);

        const transactionIdDisplay = document.getElementById('transaction-id');
        const transactionTypeDisplay = document.getElementById('transaction-type');
        const transactionStatusDisplay = document.getElementById('transaction-status');

        transactionIdDisplay!.innerHTML = `<strong>Transaction ID:</strong> ${response.transactionId}`;
        transactionTypeDisplay!.innerHTML = `<strong>Transaction Type:</strong> ${response.instruments[0].transactions[0].type}`;
        transactionStatusDisplay!.innerHTML = `<strong>Transaction ID:</strong> ${response.status}`;

        if(response.instruments[0].transactions[0].type === 'PREAUTH') {
            refundTxnBtn.classList.add('hide');
            completeTxnBtn.classList.remove('hide');
            voidTxnBtn.classList.remove('hide');
            updateCodeExamples(['setupMerchantSDK', 'completeTransaction', 'voidTransaction']);
        } else {
            completeTxnBtn.classList.add('hide');
            voidTxnBtn.classList.add('hide');
            refundTxnBtn.classList.remove('hide');
            updateCodeExamples(['setupMerchantSDK', 'refundTransaction']);
        }
        displaySection('transaction-result-panel');
    } catch (e) {
        console.log('Unable to find transaction: ', e)
        searchTxnBtn.disabled = false;
    }
}

async function refundTransaction() {
    try {
        refundTxnBtn.disabled = true;
        const response = await merchantSDK.payments.refundTransaction(
            transactionId, 
            { reason: 'Customer has requested a refund' }
        );

        populateResults(response);

        displaySection('results-panel');
    } catch (e) {
        console.log('Unable to complete refund: ', e)
        refundTxnBtn.disabled = false;
    }
}

async function completeTransaction() {
    try {
        refundTxnBtn.disabled = true;
        const response = await merchantSDK.payments.completeTransaction(
            transactionId, 
            { 
                orderNumber: `JS-SDK-REF-${secondsSinceEpoch}`, 
                clientReference: `JS-SDK-REF-${secondsSinceEpoch}` 
            }
        );

        populateResults(response);

        displaySection('results-panel');
    } catch (e) {
        console.log('Unable to complete refund: ', e)
        refundTxnBtn.disabled = false;
    }
}

async function voidTransaction() {
    try {
        refundTxnBtn.disabled = true;
        const response = await merchantSDK.payments.voidTransaction(
            transactionId, 
            { 
                orderNumber: `JS-SDK-REF-${secondsSinceEpoch}`, 
                clientReference: `JS-SDK-REF-${secondsSinceEpoch}` 
            }
        );

        populateResults(response);

        displaySection('results-panel');
    } catch (e) {
        console.log('Unable to complete refund: ', e)
        refundTxnBtn.disabled = false;
    }
}

function populateResults(response: any) {
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
}


function displaySection(id: string) {
    const section = document.getElementById(id);
    section!.classList.add('show');
    section!.style.maxHeight = section!.scrollHeight + 'px';
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

function reset() {
    const resultsPanel = document.getElementById('results-panel');
    resultsPanel!.classList.remove('show');
    resultsPanel!.removeAttribute('style');

    resultsPanel!.innerHTML = '';
    const responseHeading = document.createElement('h3');
    responseHeading.innerText = 'Response:'
    resultsPanel!.appendChild(responseHeading);
}