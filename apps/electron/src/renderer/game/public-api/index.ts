const auth = {
	login: () => {
		console.log('login');
	},
	logout: () => {
		console.log('logout');
	},
};

const combat = {
	attack: () => {
		console.log('attack');
	},
	kill: (mon: string) => {
		console.log('kill:', mon);
	},
};

