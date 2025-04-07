// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// Interface for general app types
		interface Error {}
		interface Locals {
			user?: {
				id: string;
				username: string;
				email: string;
				role: string;
			};
			token?: string;
		}
		interface PageData {}
		interface Platform {}
	}
}

// JWT Payload interface for typed access
interface JwtPayload {
	id: string;
	username: string;
	email: string;
	role: string;
	iat?: number;
	exp?: number;
}

// This adds the `user` property to Hono Context
declare module 'hono' {
	interface ContextVariableMap {
		user: JwtPayload;
		workspaceId?: string;
	}
}

export {};
