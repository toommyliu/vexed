export type Account = {
	password: string;
	username: string;
};

export type AccountWithServer = Account & {
	server: string | null;
};
