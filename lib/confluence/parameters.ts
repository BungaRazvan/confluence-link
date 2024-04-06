import { AdfElement } from "lib/builder/types";

export type SearchByCQL = {
	cql: string;
	cqlcontext?: string;
	cursor?: string;
	next?: string;
	prev?: string;
	limit?: string;
	start?: string;
	includeArchivedSpaces?: string;
	excludeCurrentSpaces?: string;
	excerpt?: string;
	sitePermissionTypeFilter?: string;
	expand?: string;
};

export type CreatePage = {
	spaceId: number;
	pageTitle: string;
	parentId?: number;
	adf?: AdfElement;
};

export type UpdatePage = {
	pageId: number;
	pageTitle: string;
	spaceId?: number;
	parentId?: number;
	ownerId?: number;
	adf?: AdfElement[];
};

export type GetPageById = {
	pageId: number;
};
