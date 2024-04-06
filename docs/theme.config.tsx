import type { DocsThemeConfig } from 'nextra-theme-docs';

export default {
	logo: <span>arcana</span>,
	project: {
		link: 'https://github.com/toommyliu/arcana',
	},
	docsRepositoryBase: 'https://github.com/toommyliu/arcana',
	// disable "Edit this page"
	editLink: {
		component: null,
	},
	// disable "Question? Give us feedback"
	feedback: {
		content: null,
	},
} satisfies DocsThemeConfig;
