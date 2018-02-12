require( "./helpers/setup" );

describe( "jsonDataSource", function() {
	let json, fsReadDirSync, fsReadFileSync, logStub;

	const config = {
		type: "json",
		path: "./content/tests/",
		server: "localhost",
		user: "username",
		password: "password",
		database: "databass"
	};

	const data = [
		{
			id: "123",
			postId: 1,
			title: "first post",
			postBody: "<b>I am a post body</b>",
			contentType: "text/html",
			slug: "first-post",
			tags: "node,npm",
			category: "Blog",
			createdBy: "dan",
			publishedOn: "2017-08-04 05:58:02.563"
		 },
		 {
			id: "456",
			postId: 2,
			title: "second post",
			postBody: "<b>I am a post body</b>",
			contentType: "text/html",
			slug: "second-post",
			tags: "node,npm",
			category: "Blog",
			createdBy: "dan",
			publishedOn: "2017-08-04 05:58:02.563"
		 },
	];

	beforeEach( () => {
		logStub = {
			error: sinon.stub()
		};
		fsReadDirSync = sinon.stub().returns( [ "file1.json", "file2.json", "file3.txt" ] );
		fsReadFileSync = sinon.stub().returns( JSON.stringify( data[ 0 ] ) );
		const fsStub = {
			readdirSync: fsReadDirSync,
			readFileSync: fsReadFileSync
		};
		const thing = proxyquire( "../../src/jsonDataSource.js", {
			fs: fsStub
		} );
		json = thing( config, logStub );
	} );

	afterEach( () => {
		fsReadFileSync.reset();
		fsReadDirSync.reset();
		logStub.error.reset();
	} );

	describe( "when calling getNewPosts", () => {
		let posts;

		beforeEach( () => {
			posts = json.getNewPosts( { query: { categoryId: 2, includeComments: false } }, Date.now() );
		} );

		it( "returns posts", () => {
			posts.length.should.equal( 2 );
		} );

		it( "reads data from json files", () => {
			fsReadDirSync.should.be.calledOnce();
			fsReadFileSync.should.be.calledTwice();
		} );
	} );

	describe( "when calling getNewPosts with no lastFetched param", () => {
		let posts;

		beforeEach( () => {
			posts = json.getNewPosts( { query: { categoryId: null, includeComments: false } } );
		} );

		it( "returns posts", () => {
			posts.length.should.equal( 2 );
		} );

		it( "reads data from json files", () => {
			fsReadDirSync.should.be.calledOnce();
			fsReadFileSync.should.be.calledTwice();
		} );
	} );

	describe( "when calling getNewPosts including comments", () => {
		let posts;

		beforeEach( () => {
			posts = json.getNewPosts( { query: { categoryId: 2, includeComments: true } }, Date.now() );
		} );

		it( "returns posts", () => {
			posts.length.should.equal( 2 );
		} );

		it( "reads data from json files", () => {
			fsReadDirSync.should.be.calledOnce();
			fsReadFileSync.should.be.calledTwice();
		} );
	} );

	describe( "when calling getDeletedPosts", () => {
		let posts;

		beforeEach( () => {
			posts = json.getDeletedPosts( { query: {} }, Date.now() );
		} );

		it( "should not return posts", () => {
			( posts === null ).should.be.true();
		} );

		it( "does not read data from json files", () => {
			fsReadDirSync.should.not.be.called();
			fsReadFileSync.should.not.be.called();
		} );
	} );
} );
