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
	spaceId: string;
	pageTitle: string;
	parentId?: string;
	adf?: AdfElement;
};

export type UpdatePage = {
	pageId: string;
	pageTitle: string;
	spaceId?: string;
	parentId?: string;
	ownerId?: string;
	adf?: AdfElement[];
};

export type GetPageById = {
	pageId: string;
};
