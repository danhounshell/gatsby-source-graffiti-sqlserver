require( "./helpers/setup" );

describe( "exports", function() {
    describe( "nodeToMarkdown", function() {
	let nodeToMarkdown, fsStub, fsExistsSyncStub, fsWriteFileSyncStub;

	let fileAlreadyExists = false;
	let options = {
	    enabled: false,
	    path: "./content/tests/"
	};

	const node = {
	    id: 1,
	    frontmatter: {
	    	date: "2017-08-04 05:58:02.563",
	    	author: {
	    	    name: "hoosier"
	    	},
	    	category: "Blog"
	    },
	    html: "<p>I am a <b>first</b> post body.<p>Lorem ipsum dolor sit amet, <img src=\"/photo1.jpg\" width=\"10\" /> consectetur adipiscing <b>Lorem</b> elit. <b>Lorem</b> Integer nec odio. Praesent <img src=\"/photo2.jpg\" width=\"10\" /> libero.</p>"
	}

	beforeEach( () => {
	    fsWriteFileSyncStub = sinon.stub();
	    fsExistsSyncStub = sinon.stub().returns( fileAlreadyExists );
	    fsStub = {
		writeFileSync: fsWriteFileSyncStub,
		existsSync: fsExistsSyncStub
	    };
	    nodeToMarkdown = proxyquire( "../../src/exportNodeToMarkdown.js", {
	       fs: fsStub
	    } );
	    nodeToMarkdown( node, options );
	} );

	afterEach( () => {
	    fsWriteFileSyncStub.reset();
	} );

	describe( "when markdown file does not already exist", () => {
		it( "should export markdown", () => {
			fsWriteFileSyncStub.should.be.calledOnce();
		} );
	} );

	describe( "when markdown file already exists and overwrite is enabled", () => {
		before( () => {
			fileAlreadyExists = true;
			options.overwriteExisting = true;
			node.frontmatter.tags = [ "hello", "world", "    ", " " ];
			node.frontmatter.category = "Uncategorized";
		} );

		after( () => {
			fileAlreadyExists = false;
			options.overwriteExisting = null;
			node.frontmatter.tags = null;
			node.frontmatter.category = "Blog";
		} );

		it( "should export markdown", () => {
			fsWriteFileSyncStub.should.be.calledOnce();
		} );
	} );

	describe( "when markdown file already exists and overwrite is default", () => {
		before( () => {
			fileAlreadyExists = true;
		} );

		after( () => {
			fileAlreadyExists = false;
		} );

		it( "should not export markdown", () => {
			fsWriteFileSyncStub.should.not.be.called();
		} );
	} );

	describe( "when markdown file already exists and overwrite is disabled", () => {
		before( () => {
			fileAlreadyExists = true;
			options.overwriteExisting = false;
		} );

		after( () => {
			fileAlreadyExists = false;
				options.overwriteExisting = null;
		} );

		it( "should not export markdown", () => {
			fsWriteFileSyncStub.should.not.be.called();
		} );
	} );
    } );
} );
