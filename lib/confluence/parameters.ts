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
