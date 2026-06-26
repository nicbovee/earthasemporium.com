/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
	readonly INSTAGRAM_ACCESS_TOKEN?: string;
	readonly INSTAGRAM_USER_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
