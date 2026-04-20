import { SignatureData } from '@stacks/connect';

export type BaseAdminMessage = {
	message: string;
	timestamp: number;
	admin: string;
};
export type Auth = {
	message: BaseAdminMessage;
	signature: SignatureData;
};
