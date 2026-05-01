import { browser } from '$app/environment';
import { isLoggedIn } from '@bigmarket/bm-common';

export const DEV_WALLET_STORAGE_KEY = 'bm.devWalletPrivateKey';

const coordinators = [
	{ stxAddress: 'SP1SCD8ERMTFYE6CK9S0MHWQCP6SY4NAVFJ538A27', btcAddress: '' },
	{
		stxAddress: 'ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G5',
		btcAddress: 'bc1qkj5yxgm3uf78qp2fdmgx2k76ccdvj7rx0qwhv0'
	},
	{
		stxAddress: 'ST1NXBK3K5YYMD6FD41MVNP3JS1GABZ8TRVX023PT',
		btcAddress: 'bc1qkj5yxgm3uf78qp2fdmgx2k76ccdvj7rx0qwhv0'
	},
	{
		stxAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
		btcAddress: 'tb1q6ue638m4t5knwxl4kwhwyuffttlp0ffee3zn3e'
	},
	{
		stxAddress: 'SP3N4AJFZZYC4BK99H53XP8KDGXFGQ2PRSQP2HGT6',
		btcAddress: 'tb1q6ue638m4t5knwxl4kwhwyuffttlp0ffee3zn3e'
	},
	{
		stxAddress: 'ST3N4AJFZZYC4BK99H53XP8KDGXFGQ2PRSPNET8TN',
		btcAddress: 'tb1q6ue638m4t5knwxl4kwhwyuffttlp0ffee3zn3e'
	},
	{ stxAddress: 'ST167Z6WFHMV0FZKFCRNWZ33WTB0DFBCW9M1FW3AY', btcAddress: '' },
	{ stxAddress: 'SP1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28GBQA1W0F', btcAddress: '' },
	{ stxAddress: 'ST30Q4WJYHGMYEE1CTGQ334R9M7KQ8ETVQ9NB134T', btcAddress: '' },
	{ stxAddress: 'ST22NW0RYCW4GFZRPE8VGJRCKGQMRMMX492QET2ZC', btcAddress: '' },
	{ stxAddress: 'STEZD95XQ194X67C1QJW4PHKDG8F5D66ZCYFX27A', btcAddress: '' },
	{ stxAddress: 'ST105HCS1RTR7D61EZET8CWNEF24ENEN3V6ARBYBJ', btcAddress: '' }, //am
	{ stxAddress: 'SPEZD95XQ194X67C1QJW4PHKDG8F5D66ZCT8BY29', btcAddress: '' },
	{ stxAddress: 'SP3N1MPGR5ABZ1AX0SW2DDP5KKZSKB93WDYXQA1H8', btcAddress: '' },
	{ stxAddress: 'ST3Y12HJYP2NMNAFHWBPM2CMYDHYXME1F46VC5SPJ', btcAddress: '' },
	{ stxAddress: 'ST3NS9010CQ9AK3M6XN3XD9EHNTDZVGYSMCBG3K6Z', btcAddress: '' },
	{ stxAddress: 'SP2Z2CBMGWB9MQZAF5Z8X56KS69XRV3SJF4WKJ7J9', btcAddress: '' }, // deorg
	{ stxAddress: 'SPQE3J7XMMK0DN0BWJZHGE6B05VDYQRXRMDV734D', btcAddress: '' } // jb
];

export function isCoordinator(address: string | undefined) {
	if (!browser) return false;
	if (!address || !isLoggedIn()) return false;
	const index = coordinators.findIndex((o) => o.stxAddress === address);
	return index > -1;
}

const testKeys = [
	{
		name: 'deployer',
		address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
		privateKey: '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601'
	},
	{
		name: 'user1',
		address: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
		privateKey: '7287ba251d44a4d3fd9276c88ce34c5c52a038955511cccaf77e61068649c17801'
	},
	{
		name: 'user2',
		address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
		privateKey: '530d9f61984c888536871c6573073bdfc0058896dc1adfe9a6a10dfacadc209101'
	},
	{
		name: 'user3',
		address: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC',
		privateKey: 'd655b2523bcd65e34889725c73064feb17ceb796831c0e111ba1a552b0f31b3901'
	},
	{
		name: 'user4',
		address: 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND',
		privateKey: 'f9d7206a47f14d2870c163ebab4bf3e70d18f5d14ce1031f3902fbbc894fe4c701'
	},
	{
		name: 'user5',
		address: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
		privateKey: '3eccc5dac8056590432db6a35d52b9896876a3d5cbdea53b72400bc9c2099fe801'
	},
	{
		name: 'user6',
		address: 'ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0',
		privateKey: '7036b29cb5e235e5fd9b09ae3e8eec4404e44906814d5d01cbca968a60ed4bfb01'
	},
	{
		name: 'user7',
		address: 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ',
		privateKey: 'b463f0df6c05d2f156393eee73f8016c5372caa0e9e29a901bb7171d90dc4f1401'
	},
	{
		name: 'user8',
		address: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP',
		privateKey: '6a1a754ba863d7bab14adbbc3f8ebb090af9e871ace621d3e5ab634e1422885e01'
	},
	{
		name: 'user9',
		address: 'STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6',
		privateKey: 'de433bdfa14ec43aa1098d5be594c8ffb20a31485ff9de2923b2689471c401b801'
	}
];

export function getAddresses(): string[] {
	return testKeys.map((o) => o.address);
}
