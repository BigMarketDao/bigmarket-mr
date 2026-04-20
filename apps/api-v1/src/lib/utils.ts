import { DateTime } from 'luxon';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

export function estimateBitcoinBlockTime(targetBlock: number, currentBlock: number, currentTimeUtc: string = DateTime.utc().toISO()): string {
	const BLOCK_INTERVAL_SEC = 600; // 10 minutes per block
	const blockDifference = targetBlock - currentBlock;
	const timeShiftSeconds = blockDifference * BLOCK_INTERVAL_SEC;
	const currentTime = DateTime.fromISO(currentTimeUtc, { zone: 'utc' });
	const estimatedTime = currentTime.plus({ seconds: timeShiftSeconds });
	return estimatedTime.setZone('utc').toFormat("dd MMM yyyy HH:mm 'UTC'");
}
export function formatFiat(raw: number): string {
	const value = raw;
	return value.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		currencyDisplay: 'code', // shows "USD 1,234.56"
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}

export function asyncHandler<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(fn: (req: Request<P, ResBody, ReqBody, ReqQuery>, res: Response<ResBody>, next: NextFunction) => Promise<any>): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
	return (req, res, next) => {
		void fn(req, res, next).catch(next);
	};
}
