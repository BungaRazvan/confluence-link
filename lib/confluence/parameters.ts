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
};

export type UpdatePage = {
	pageId: number;
	pageTitle: string;
	spaceId?: number;
	parentId?: number;
	ownerId?: number;
};

export type GetPageById = {
	pageId: number;
};
