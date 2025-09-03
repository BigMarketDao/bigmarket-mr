import express from 'express';
import { getConfig } from '../../lib/config.js';
const { ReclaimProofRequest, verifyProof } = require('@reclaimprotocol/js-sdk');

const router = express.Router();

const BASE_URL = getConfig().host === 'http://localhost' ? `${getConfig().host}:8081` : 'https://bigmarket.ai';
//const BASE_URL = 'https://bigmarket.ai';

router.post('/receive-proofs', async (req, res) => {
	// decode the urlencoded proof object; see below if not using express middlewares for decoding
	const decodedBody = decodeURIComponent(req.body);
	const proof = JSON.parse(decodedBody);

	// Verify the proof using the SDK verifyProof function
	const result = await verifyProof(proof);
	if (!result) {
		res.status(400).json({ error: 'Invalid proofs data' });
	}

	console.log('Received proofs:', proof);
	// Process the proofs here
	res.json(proof);
});

router.get('/generate-config/:provider', async (req, res) => {
	const APP_ID = getConfig().zkTlsAppId;
	const APP_SECRET = getConfig().zkTlsAppSecret;
	const provider = req.params.provider.toLocaleLowerCase();
	let PROVIDER_ID = getConfig().zkTlsProviderGoogle;
	if (provider === 'linkedin') PROVIDER_ID = getConfig().zkTlsProviderLinkedIn;
	if (provider === 'github') PROVIDER_ID = getConfig().zkTlsProviderGithub;
	if (provider === 'twitter') PROVIDER_ID = getConfig().zkTlsProviderTwitter;

	try {
		const reclaimProofRequest = await ReclaimProofRequest.init(APP_ID, APP_SECRET, PROVIDER_ID);

		// we will be defining this endpoint in the next step
		reclaimProofRequest.setAppCallbackUrl(BASE_URL + '/receive-proofs');

		const reclaimProofRequestConfig = reclaimProofRequest.toJsonString();

		res.json({ reclaimProofRequestConfig });
	} catch (error) {
		console.error('Error generating request config:', error);
		res.status(500).json({ error: 'Failed to generate request config' });
	}
});
