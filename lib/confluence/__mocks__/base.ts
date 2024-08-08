export const mockBaseClient = jest.fn();

const mock = jest.fn().mockImplementation(() => {
	return { BaseClient: mockBaseClient };
});

export default mock;
