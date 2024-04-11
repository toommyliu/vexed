import type { DocsThemeConfig } from 'nextra-theme-docs';

export default {
	logo: <span>vexed</span>,
	project: {
		link: 'https://github.com/toommyliu/vexed',
	},
	docsRepositoryBase: 'https://github.com/toommyliu/vexed',
	// disable "Edit this page"
	editLink: {
		component: null,
	},
	// disable "Question? Give us feedback"
	feedback: {
		content: null,
	},
} satisfies DocsThemeConfig;
