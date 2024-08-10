export interface ConfluenceLinkSettings {
	confluenceDomain: string;
	atlassianUsername: string;
	atlassianApiToken: string;
	confluenceDefaultSpaceId: string;
	followLinks: boolean;
	uploadTags: boolean;
}

export interface Config {
	host: string;
	authentication: {
		email: string;
		apiToken: string;
	};
}

export interface UrlConfig {
	url: string;
	method: "GET" | "POST" | "PUT" | "DELETE";
}

export interface RequestConfig extends UrlConfig {
	params?: object;
}

export interface ObsidianRequestParams extends UrlConfig {
	body?: string;
}

export interface Client {
	config: Config;
	sendRequest<T>(requestConfig: RequestConfig): T;
}

export type PageResponse = {
	id: string;
	status: "current";
	title: string;
	spaceId: string;
	parentId: string;
	parentType: "page";
	position: number;
	authorId: string;
	ownerId: string;
	lastOwnerId: string;
	createdAt: string;
	version: {
		createdAt: string;
		message: string;
		number: number;
		minorEdit: boolean;
		authorId: string;
	};
	body: { storage: {}; atlas_doc_format: {}; view: {} };
	labels: {
		results: [{ id: string; name: string; prefix: string }];
		meta: { hasMore: boolean; cursor: string };
		_links: { self: string };
	};
	properties: {
		results: [{ id: string; key: string; version: {} }];
		meta: { hasMore: boolean; cursor: string };
		_links: { self: string };
	};
	operations: {
		results: [{ operation: string; targetType: string }];
		meta: { hasMore: boolean; cursor: string };
		_links: { self: string };
	};
	likes: {
		results: [{ accountId: string }];
		meta: { hasMore: boolean; cursor: string };
		_links: { self: string };
	};
	versions: {
		results: [
			{
				createdAt: string;
				message: string;
				number: number;
				minorEdit: boolean;
				authorId: string;
			}
		];
		meta: { hasMore: boolean; cursor: string };
		_links: { self: string };
	};
	isFavoritedByCurrentUser: boolean;
	_links: { base: string; webui: string };
};

export type GetPagesResponse = {
	results: [
		{
			id: string;
			status: "current";
			title: string;
			spaceId: string;
			parentId: string;
			parentType: "page";
			position: number;
			authorId: string;
			ownerId: string;
			lastOwnerId: string;
			createdAt: string;
			version: {
				createdAt: string;
				message: string;
				number: number;
				minorEdit: boolean;
				authorId: string;
			};
			body: { storage: {}; atlas_doc_format: {} };
			_links: {
				webui: string;
				editui: string;
				tinyui: string;
			};
		}
	];
	_links: { next: string; base: string };
};

export type SpaceResponse = {
	results: [
		{
			id: string;
			key: string;
			name: string;
			type: "global";
			status: "current";
			authorId: string;
			createdAt: string;
			homepageId: string;
			description: { plain: {}; view: {} };
			icon: { path: string; apiDownloadLink: string };
			_links: { webui: string };
		}
	];
	_links: { next: string; base: string };
};

export type SearchResponse = {
	results: [
		{
			content: {
				id: string;
				type: string;
				status: string;
				title: string;
				space: {
					key: string;
					name: string;
					type: string;
					status: string;
					_expandable: {};
					_links: {};
				};
				history: { latest: boolean };
				version: { when: string; number: number; minorEdit: boolean };
				ancestors: [];
				operations: [{ operation: "administer"; targetType: string }];
				children: {};
				childTypes: {};
				descendants: {};
				container: {};
				body: {
					view: { value: string; representation: "view" };
					export_view: { value: string; representation: "view" };
					styled_view: { value: string; representation: "view" };
					storage: { value: string; representation: "view" };
					wiki: { value: string; representation: "view" };
					editor: { value: string; representation: "view" };
					editor2: { value: string; representation: "view" };
					anonymous_export_view: {
						value: string;
						representation: "view";
					};
					atlas_doc_format: {
						value: string;
						representation: "view";
					};
					dynamic: { value: string; representation: "view" };
					raw: { value: string; representation: "view" };
					_expandable: {
						editor: string;
						view: string;
						export_view: string;
						styled_view: string;
						storage: string;
						editor2: string;
						anonymous_export_view: string;
						atlas_doc_format: string;
						wiki: string;
						dynamic: string;
						raw: string;
					};
				};
				restrictions: {
					read: {
						operation: "administer";
						_expandable: {};
						_links: {};
					};
					update: {
						operation: "administer";
						_expandable: {};
						_links: {};
					};
					_expandable: { read: string; update: string };
					_links: {};
				};
				metadata: {};
				macroRenderedOutput: {};
				extensions: {};
				_expandable: {
					childTypes: string;
					container: string;
					metadata: string;
					operations: string;
					children: string;
					restrictions: string;
					history: string;
					ancestors: string;
					body: string;
					version: string;
					descendants: string;
					space: string;
					extensions: string;
					schedulePublishDate: string;
					schedulePublishInfo: string;
					macroRenderedOutput: string;
				};
				_links: {};
			};
			user: {
				type: "known";
				username: string;
				userKey: string;
				accountId: string;
				accountType: "atlassian";
				email: string;
				publicName: string;
				profilePicture: {
					path: string;
					width: number;
					height: number;
					isDefault: boolean;
				};
				displayName: string;
				timeZone: string;
				isExternalCollaborator: boolean;
				externalCollaborator: boolean;
				operations: [{ operation: "administer"; targetType: string }];
				details: {};
				personalSpace: {
					key: string;
					name: string;
					type: string;
					status: string;
					_expandable: {};
					_links: {};
				};
				_expandable: {
					operations: string;
					details: string;
					personalSpace: string;
				};
				_links: {};
			};
			space: {
				id: number;
				key: string;
				name: string;
				icon: {
					path: string;
					width: number;
					height: number;
					isDefault: boolean;
				};
				description: {
					plain: {
						value: string;
						representation: "plain";
						embeddedContent: [{}];
					};
					view: {
						value: string;
						representation: "plain";
						embeddedContent: [{}];
					};
					_expandable: { view: string; plain: string };
				};
				homepage: { type: string; status: string };
				type: string;
				metadata: {
					labels: {
						results: [
							{
								prefix: string;
								name: string;
								id: string;
								label: string;
							}
						];
						size: number;
					};
					_expandable: {};
				};
				operations: [{ operation: "administer"; targetType: string }];
				permissions: [
					{
						operation: {
							operation: "administer";
							targetType: string;
						};
						anonymousAccess: boolean;
						unlicensedAccess: boolean;
					}
				];
				status: string;
				settings: { routeOverrideEnabled: boolean; _links: {} };
				theme: { themeKey: string };
				lookAndFeel: {
					headings: { color: string };
					links: { color: string };
					menus: {
						hoverOrFocus: { backgroundColor: string };
						color: string;
					};
					header: {
						backgroundColor: string;
						button: {
							backgroundColor: string;
							color: string;
						};
						primaryNavigation: {
							color: string;
							hoverOrFocus: {
								backgroundColor: string;
								color: string;
							};
						};
						secondaryNavigation: {
							color: string;
							hoverOrFocus: {
								backgroundColor: string;
								color: string;
							};
						};
						search: {
							backgroundColor: string;
							color: string;
						};
					};
					content: {};
					bordersAndDividers: { color: string };
				};
				history: {
					createdDate: string;
					createdBy: { type: "known" };
				};
				_expandable: {
					settings: string;
					metadata: string;
					operations: string;
					lookAndFeel: string;
					permissions: string;
					icon: string;
					description: string;
					theme: string;
					history: string;
					homepage: string;
					identifiers: string;
				};
				_links: {};
			};
			title: string;
			excerpt: string;
			url: string;
			resultParentContainer: {
				title: string;
				displayUrl: string;
			};
			resultGlobalContainer: {
				title: string;
				displayUrl: string;
			};
			breadcrumbs: [{ label: string; url: string; separator: string }];
			entityType: string;
			iconCssClass: string;
			lastModified: string;
			friendlyLastModified: string;
			score: number;
		}
	];
	start: number;
	limit: number;
	size: number;
	totalSize: number;
	cqlQuery: string;
	searchDuration: number;
	archivedResultCount: number;
	_links: {};
};

export type UploadResponse = {
	results: {
		id: string;
		type: string;
		status: string;
		title: string;
		version: {
			by: {
				type: "known";
				accountId: string;
				accountType: "atlassian";
				email: string;
				publicName: string;
				profilePicture: {
					path: string;
					width: number;
					height: number;
					isDefault: boolean;
				};
				displayName: string;
				isExternalCollaborator: boolean;
				_expandable: { operations: string; personalSpace: string };
				_links: { self: string };
			};
			when: string;
			friendlyWhen: string;
			message: string;
			number: number;
			minorEdit: boolean;
			contentTypeModified: boolean;
			_expandable: { collaborators: string; content: string };
			_links: { self: string };
		};
		container: {
			id: string;
			type: string;
			status: string;
			title: string;
			macroRenderedOutput: {};
			extensions: { position: number };
			_expandable: {
				container: string;
				metadata: string;
				restrictions: string;
				history: string;
				body: string;
				version: string;
				descendants: string;
				space: string;
				childTypes: string;
				schedulePublishInfo: string;
				operations: string;
				schedulePublishDate: string;
				children: string;
				ancestors: string;
			};
			_links: {
				self: string;
				tinyui: string;
				editui: string;
				webui: string;
			};
		};
		macroRenderedOutput: {};
		metadata: {
			comment: string;
			mediaType: string;
			labels: {
				results: [];
				start: number;
				limit: number;
				size: number;
				_links: { next: string; self: string };
			};
			_expandable: {
				currentuser: string;
				comments: string;
				sourceTemplateEntityId: string;
				simple: string;
				properties: string;
				frontend: string;
				likes: string;
			};
		};
		extensions: {
			mediaType: string;
			fileSize: number;
			comment: string;
			mediaTypeDescription: string;
			fileId: string;
			collectionName: string;
		};
		_expandable: {
			childTypes: string;
			schedulePublishInfo: string;
			operations: string;
			schedulePublishDate: string;
			children: string;
			restrictions: string;
			history: string;
			ancestors: string;
			body: string;
			descendants: string;
			space: string;
		};
		_links: {
			webui: string;
			self: string;
			download: string;
		};
	}[];
	size: number;
	_links: { base: string; context: string };
};
