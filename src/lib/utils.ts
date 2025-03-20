import { DateTime } from 'luxon';

export function estimateBitcoinBlockTime(targetBlock: number, currentBlock: number, currentTimeUtc: string = DateTime.utc().toISO()): string {
	const BLOCK_INTERVAL_SEC = 600; // 10 minutes per block
	const blockDifference = targetBlock - currentBlock;
	const timeShiftSeconds = blockDifference * BLOCK_INTERVAL_SEC;
	const currentTime = DateTime.fromISO(currentTimeUtc, { zone: 'utc' });
	const estimatedTime = currentTime.plus({ seconds: timeShiftSeconds });
	return estimatedTime.toFormat('yyyy-MM-dd HH:mm');
}
