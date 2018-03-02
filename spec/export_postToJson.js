require( "./helpers/setup" );

describe( "exports", function() {
	describe( "postToJson", function() {
		let postToJson, fsStub, fsExistsSyncStub, fsWriteFileSyncStub;

		let fileAlreadyExists = false;
		let options = {
			exportToJson: {
				enabled: false,
				path: "./content/tests/"
			}
		};

		beforeEach( () => {
			fsWriteFileSyncStub = sinon.stub();
        	fsExistsSyncStub = sinon.stub().returns( fileAlreadyExists );
        	fsStub = {
        		writeFileSync: fsWriteFileSyncStub,
        		existsSync: fsExistsSyncStub
        	};
	        postToJson = proxyquire( "../../src/exports/postToJson.js", {
	            fs: fsStub
	        } );
	        postToJson( { id: 1, postDate: "2017-08-04 05:58:02.563" }, options );
		} );

	    afterEach( () => {
	        fsWriteFileSyncStub.reset();
	    } );

        describe( "when json file does not already exist", () => {
	        it( "should export json", () => {
	        	fsWriteFileSyncStub.should.be.calledOnce();
	        } );
        } );

        describe( "when json file already exists and overwrite is enabled", () => {
        	before( () => {
        		fileAlreadyExists = true;
        		options.exportToJson.overwriteExisting = true;
        	} );

        	after( () => {
        		fileAlreadyExists = false;
        		options.exportToJson.overwriteExisting = null;
        	} );

	        it( "should export json", () => {
	        	fsWriteFileSyncStub.should.be.calledOnce();
	        } );
        } );

        describe( "when json file already exists and overwrite is default", () => {
        	before( () => {
        		fileAlreadyExists = true;
        	} );

        	after( () => {
        		fileAlreadyExists = false;
        	} );

	        it( "should export json", () => {
	        	fsWriteFileSyncStub.should.not.be.called();
	        } );
        } );

        describe( "when json file already exists and overwrite is disabled", () => {
        	before( () => {
        		fileAlreadyExists = true;
        		options.exportToJson.overwriteExisting = false;
        	} );

        	after( () => {
        		fileAlreadyExists = false;
				options.exportToJson.overwriteExisting = null;
        	} );

	        it( "should export json", () => {
	        	fsWriteFileSyncStub.should.not.be.called();
	        } );
        } );
	} );
} );
