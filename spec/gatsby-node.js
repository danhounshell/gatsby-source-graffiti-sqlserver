require( "./helpers/setup" );

describe( "gatsby-node", function() {
    let sqlStub, sqlGetNewPosts, sqlGetDeletedPosts,
        jsonStub, jsonGetNewPosts, jsonGetDeletedPosts,
        fsStub, fsWriteFileSyncStub,
        pluginBoundActionCreators, pluginReporter, pluginStore;

    let sqlShouldResolve = true;
    let jsonShouldResolve = true;
    let thisPluginIsNull = false;
    let thisPluginIsEmpty = false;
    let lastFetchedPosts = Date.now();
    let lastDeletedPosts = Date.now();

    const data = [
        {
            id: "123",
            title: "first post",
            postBody: "<b>I am a post <img src=\"/photo.jpg\" width=\"10\" alt=\"picture\" /> body</b>",
            contentType: "text/html",
            slug: "first-post",
            tags: "node,npm",
            category: "Blog",
            createdBy: "dan",
            publishedOn: "2017-08-04 05:58:02.563"
         },
         {
            id: "456",
            title: "second post",
            postBody: "<b>I am a post body. <a href=\"http://deleteme.com/links/blog/images/someImage.jpg\">Some Link</a> <a href=\"http://deleteme2.com/links/blog/images/anotherImage.jpg\">Some Link</a></b>",
            contentType: "text/html",
            slug: "second-post",
            tags: "node,npm",
            category: "Blog",
            createdBy: "dan",
            publishedOn: "2017-08-04 05:58:02.563"
         },
    ];

    let pluginOptions = {
        dataSource: {
        	"type": "",
            "server": "localhost",
            "user": "username",
            "password": "password",
            "database": "databass",
            "path": "./content/tests/"
        },
        query: {
            categoryId: 2
        },
        descriptionLength: 200,
        exportToJson: {
        	enabled: false,
        	path: "./content/tests/"
        }
    };

    beforeEach( () => {
        sqlGetNewPosts = sqlShouldResolve ? sinon.stub().resolves( data ) : sinon.stub().resolves( null );
        sqlGetDeletedPosts = sqlShouldResolve ? sinon.stub().resolves( data ) : sinon.stub().resolves( null );
        sqlStub = sinon.stub().returns( {
            getNewPosts: sqlGetNewPosts,
            getDeletedPosts: sqlGetDeletedPosts
        } );
        jsonGetNewPosts = jsonShouldResolve ? sinon.stub().resolves( data ) : sinon.stub().resolves( null );
        jsonGetDeletedPosts = sinon.stub().resolves( null );
        jsonStub = sinon.stub().returns( {
        	getNewPosts: jsonGetNewPosts,
        	getDeletedPosts: jsonGetDeletedPosts
        } );
        fsWriteFileSyncStub = sinon.stub();
        fsStub = {
        	writeFileSync: fsWriteFileSyncStub
        };
        pluginBoundActionCreators = {
            createNode: sinon.stub(),
            deleteNode: sinon.stub(),
            setPluginStatus: sinon.stub(),
        };
        pluginReporter = {
            info: sinon.stub()
        };
        pluginStore = {
            getState: function() {
                return {
                    status: {
                        plugins: thisPluginIsNull ? null : thisPluginIsEmpty ? {
                            "gatsby-source-graffiti-sqlserver": {}
                        } : {
                            "gatsby-source-graffiti-sqlserver": {
                                status: {
                                    lastFetchedPosts,
                                    lastDeletedPosts
                                }
                            }
                        }
                    }
                }
            }
        };
        const inputArgs = [
            {
                boundActionCreators: pluginBoundActionCreators,
                reporter: pluginReporter,
                store: pluginStore
            },
            pluginOptions
        ];
        const gatsbyNode = proxyquire( "../../src/gatsby-node.js", {
            "./sqlDataSource": sqlStub,
            "./jsonDataSource": jsonStub,
            fs: fsStub
        } );
        gatsbyNode.sourceNodes( ...inputArgs );
    } );

    afterEach( () => {
        sqlStub.reset();
        sqlGetNewPosts.reset();
        sqlGetDeletedPosts.reset();
        jsonStub.reset();
        jsonGetNewPosts.reset();
        jsonGetDeletedPosts.reset();
        pluginBoundActionCreators.createNode.reset();
        pluginBoundActionCreators.deleteNode.reset();
        pluginBoundActionCreators.setPluginStatus.reset();
        pluginReporter.info.reset();
        fsWriteFileSyncStub.reset();
    } );

    describe( "using static data source", () => {
        before( () => {
            pluginOptions.dataSource.type = "static";
        } );

        after( () => {
            pluginOptions.dataSource.type = "";
        } );

		describe( "when executing source nodes", () => {
	        it( "should not query new posts", () => {
	            sqlGetNewPosts.should.not.be.called();
	        } );

	        it( "should query deleted posts", () => {
	            sqlGetDeletedPosts.should.not.be.called();
	        } );

	        it( "should call createNode", () => {
	            pluginBoundActionCreators.createNode.should.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 15 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call setPluginStatus only once", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
	        } );

	        it( "should not export json", () => {
	        	fsWriteFileSyncStub.should.not.be.called();
	        } );
	    } );

	    describe( "when exportToJson is enabled", () => {
	        before( () => {
	            pluginOptions.exportToJson.enabled = true;
	        } );

	        after( () => {
				pluginOptions.exportToJson.enabled = false;
	        } );

	        it( "should not export json", () => {
	        	fsWriteFileSyncStub.should.not.be.called();
	        } );
	    } );
    } );

    describe( "using json data source", () => {
        before( () => {
            pluginOptions.dataSource.type = "json";
        } );

        after( () => {
            pluginOptions.dataSource.type = "";
        } );

	    describe( "when executing sourceNodes", () => {
	        it( "should set json config", () => {
	            jsonStub.should.be.calledOnce();
	            jsonStub.getCall( 0 ).args[ 0 ].path.should.equal( pluginOptions.dataSource.path );
	        } );

	        it( "should call createNode for each item returned from json", () => {
	            pluginBoundActionCreators.createNode.should.be.calledTwice();
	            pluginBoundActionCreators.createNode.getCall( 0 ).args[ 0 ].frontmatter.title.should.equal( data[ 0 ].title );
	            pluginBoundActionCreators.createNode.getCall( 0 ).args[ 0 ].frontmatter.cover.should.equal( "/photo.jpg" );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].frontmatter.title.should.equal( data[ 1 ].title );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].frontmatter.cover.should.equal( "" );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.contain( "http://deleteme.com/links/blog/images/someImage.jpg" );
				pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.contain( "http://deleteme2.com/links/blog/images/anotherImage.jpg" );
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call setPluginStatus twice", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
	        } );

	        it( "should not export json", () => {
	        	fsWriteFileSyncStub.should.not.be.called();
	        } );
	    } );

	    describe( "when executing sourceNodes and replacing strings", () => {
	        before( () => {
	            pluginOptions.replaceStrings = [
	            	{
	            		source: "http://deleteme.com/links/blog/",
	            		value: "/files/"
	            	},
	            	{
	            		source: "http://deleteme2.com/links/blog/",
	            		value: "/otherfiles/"
	            	}
	            ];
	        } );

	        after( () => {
	            pluginOptions.replaceStrings = [];
	        } );

	        it( "should replace selected text in html field of nodes created", () => {
	            pluginBoundActionCreators.createNode.should.be.calledTwice();
	            pluginBoundActionCreators.createNode.getCall( 0 ).args[ 0 ].frontmatter.title.should.equal( data[ 0 ].title );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].frontmatter.title.should.equal( data[ 1 ].title );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.not.contain( "http://deleteme.com/links/blog/images/someImage.jpg" );
				pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.not.contain( "http://deleteme2.com/links/blog/images/anotherImage.jpg" );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.contain( "/files/images/someImage.jpg" );
				pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.contain( "/otherfiles/images/anotherImage.jpg" );
	        } );
	    } );

	    describe( "when json works", () => {
	        it( "should query new posts", () => {
	            jsonGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should query deleted posts", () => {
	            jsonGetDeletedPosts.should.be.calledOnce();
	        } );
	    } );

	    describe( "when json errors", () => {
	        before( () => {
	            jsonShouldResolve = false;
	        } );

	        after( () => {
	            jsonShouldResolve = true;
	        } );

	        it( "should query new posts", () => {
	            jsonGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should query deleted posts", () => {
	            jsonGetDeletedPosts.should.be.calledOnce();
	        } );

	        it( "should not call createNode", () => {
	            pluginBoundActionCreators.createNode.should.not.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 0 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should not call setPluginStatus", () => {
	            pluginBoundActionCreators.setPluginStatus.should.not.be.called();
	        } );
	    } );

	    describe( "when lastFetchedPosts is null", () => {
	        before( () => {
	            lastFetchedPosts = null;
	        } );

	        after( () => {
	            lastFetchedPosts = Date.now();
	        } );

	        it( "should query new posts", () => {
	            jsonGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should query deleted posts", () => {
	            jsonGetDeletedPosts.should.be.calledOnce();
	        } );

	        it( "should call createNode", () => {
	            pluginBoundActionCreators.createNode.should.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call setPluginStatus once", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
	        } );
	    } );

	    describe( "when lastDeletedPosts is null", () => {
	        before( () => {
	            lastDeletedPosts = null;
	        } );

	        after( () => {
	            lastDeletedPosts = Date.now();
	        } );

	        it( "should query new posts", () => {
	            jsonGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should not query deleted posts", () => {
	            jsonGetDeletedPosts.should.not.be.called();
	        } );

	        it( "should call createNode", () => {
	            pluginBoundActionCreators.createNode.should.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call setPluginStatus once", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
	        } );
	    } );

	    describe( "when store has no key for this plugin", () => {
	        before( () => {
	            thisPluginIsNull = true;
	        } );

	        after( () => {
	            thisPluginIsNull = false;
	        } );

	        it( "should query new posts", () => {
	            jsonGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should not query deleted posts", () => {
	            jsonGetDeletedPosts.should.not.be.called();
	        } );

	        it( "should call createNode", () => {
	            pluginBoundActionCreators.createNode.should.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call setPluginStatus once", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
	        } );
	    } );

	    describe( "when store has key for this plugin but it is empty", () => {
	        before( () => {
	            thisPluginIsEmpty = true;
	        } );

	        after( () => {
	            thisPluginIsEmpty = false;
	        } );

	        it( "should query new posts", () => {
	            jsonGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should not query deleted posts", () => {
	            jsonGetDeletedPosts.should.not.be.calledOnce();
	        } );

	        it( "should call createNode", () => {
	            pluginBoundActionCreators.createNode.should.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call setPluginStatus once", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
	        } );
	    } );

	    describe( "when exportToJson is enabled", () => {
	        before( () => {
	            pluginOptions.exportToJson.enabled = true;
	        } );

	        after( () => {
				pluginOptions.exportToJson.enabled = false;
	        } );

	        it( "should not export json", () => {
	        	fsWriteFileSyncStub.should.not.be.called();
	        } );
	    } );
    } );

    describe( "using sql data source", () => {
        before( () => {
            pluginOptions.dataSource.type = "sql";
            pluginOptions.replaceStrings = [];
        } );

        after( () => {
            pluginOptions.dataSource.type = "";
        } );

	    describe( "when executing sourceNodes", () => {
	        it( "should set sql config", () => {
	            sqlStub.should.be.calledOnce();
	            sqlStub.getCall( 0 ).args[ 0 ].server.should.equal( pluginOptions.dataSource.server );
	            sqlStub.getCall( 0 ).args[ 0 ].user.should.equal( pluginOptions.dataSource.user );
	            sqlStub.getCall( 0 ).args[ 0 ].password.should.equal( pluginOptions.dataSource.password );
	            sqlStub.getCall( 0 ).args[ 0 ].database.should.equal( pluginOptions.dataSource.database );
	        } );

	        it( "should call createNode for each item returned from sql", () => {
	            pluginBoundActionCreators.createNode.should.be.calledTwice();
	            pluginBoundActionCreators.createNode.getCall( 0 ).args[ 0 ].frontmatter.title.should.equal( data[ 0 ].title );
	            pluginBoundActionCreators.createNode.getCall( 0 ).args[ 0 ].frontmatter.cover.should.equal( "/photo.jpg" );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].frontmatter.title.should.equal( data[ 1 ].title );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].frontmatter.cover.should.equal( "" );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.contain( "http://deleteme.com/links/blog/images/someImage.jpg" );
				pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.contain( "http://deleteme2.com/links/blog/images/anotherImage.jpg" );
	        } );

	        it( "should call deleteNode for each item returned from sql", () => {
	            pluginBoundActionCreators.deleteNode.should.be.calledTwice();
	            pluginBoundActionCreators.deleteNode.getCall( 0 ).args[ 0 ].should.equal( data[ 0 ].id );
	            pluginBoundActionCreators.deleteNode.getCall( 0 ).args[ 1 ].frontmatter.title.should.equal( data[ 0 ].title );
	            pluginBoundActionCreators.deleteNode.getCall( 1 ).args[ 0 ].should.equal( data[ 1 ].id );
	            pluginBoundActionCreators.deleteNode.getCall( 1 ).args[ 1 ].frontmatter.title.should.equal( data[ 1 ].title );
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 2 nodes" );
	        } );

	        it( "should call setPluginStatus twice", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledTwice();
	        } );

	        it( "should not export json", () => {
	        	fsWriteFileSyncStub.should.not.be.called();
	        } );
	    } );

	    describe( "when executing sourceNodes and replacing strings", () => {
	        before( () => {
	            pluginOptions.replaceStrings = [
	            	{
	            		source: "http://deleteme.com/links/blog/",
	            		value: "/files/"
	            	},
	            	{
	            		source: "http://deleteme2.com/links/blog/",
	            		value: "/otherfiles/"
	            	}
	            ];
	        } );

	        after( () => {
	            pluginOptions.replaceStrings = null;
	        } );

	        it( "should replace selected text in html field of nodes created", () => {
	            pluginBoundActionCreators.createNode.should.be.calledTwice();
	            pluginBoundActionCreators.createNode.getCall( 0 ).args[ 0 ].frontmatter.title.should.equal( data[ 0 ].title );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].frontmatter.title.should.equal( data[ 1 ].title );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.not.contain( "http://deleteme.com/links/blog/images/someImage.jpg" );
				pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.not.contain( "http://deleteme2.com/links/blog/images/anotherImage.jpg" );
	            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.contain( "/files/images/someImage.jpg" );
				pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].html.should.contain( "/otherfiles/images/anotherImage.jpg" );
	        } );
	    } );

	    describe( "when sql works", () => {
	        it( "should query new posts", () => {
	            sqlGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should query deleted posts", () => {
	            sqlGetDeletedPosts.should.be.calledOnce();
	        } );
	    } );

	    describe( "when sql errors", () => {
	        before( () => {
	            sqlShouldResolve = false;
	        } );

	        after( () => {
	            sqlShouldResolve = true;
	        } );

	        it( "should query new posts", () => {
	            sqlGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should query deleted posts", () => {
	            sqlGetDeletedPosts.should.be.calledOnce();
	        } );

	        it( "should not call createNode", () => {
	            pluginBoundActionCreators.createNode.should.not.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 0 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call not call setPluginStatus twice", () => {
	            pluginBoundActionCreators.setPluginStatus.should.not.be.called();
	        } );
	    } );

	    describe( "when lastFetchedPosts is null", () => {
	        before( () => {
	            lastFetchedPosts = null;
	        } );

	        after( () => {
	            lastFetchedPosts = Date.now();
	        } );

	        it( "should query new posts", () => {
	            sqlGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should query deleted posts", () => {
	            sqlGetDeletedPosts.should.be.calledOnce();
	        } );

	        it( "should call createNode", () => {
	            pluginBoundActionCreators.createNode.should.be.called();
	        } );

	        it( "should call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 2 nodes" );
	        } );

	        it( "should call setPluginStatus twice", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledTwice();
	        } );
	    } );

	    describe( "when lastDeletedPosts is null", () => {
	        before( () => {
	            lastDeletedPosts = null;
	        } );

	        after( () => {
	            lastDeletedPosts = Date.now();
	        } );

	        it( "should query new posts", () => {
	            sqlGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should not query deleted posts", () => {
	            sqlGetDeletedPosts.should.not.be.called();
	        } );

	        it( "should call createNode", () => {
	            pluginBoundActionCreators.createNode.should.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call setPluginStatus once", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
	        } );
	    } );

	    describe( "when store has no key for this plugin", () => {
	        before( () => {
	            thisPluginIsNull = true;
	        } );

	        after( () => {
	            thisPluginIsNull = false;
	        } );

	        it( "should query new posts", () => {
	            sqlGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should not query deleted posts", () => {
	            sqlGetDeletedPosts.should.not.be.called();
	        } );

	        it( "should call createNode", () => {
	            pluginBoundActionCreators.createNode.should.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call setPluginStatus once", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
	        } );
	    } );

	    describe( "when store has key for this plugin but it is empty", () => {
	        before( () => {
	            thisPluginIsEmpty = true;
	        } );

	        after( () => {
	            thisPluginIsEmpty = false;
	        } );

	        it( "should query new posts", () => {
	            sqlGetNewPosts.should.be.calledOnce();
	        } );

	        it( "should not query deleted posts", () => {
	            sqlGetDeletedPosts.should.not.be.calledOnce();
	        } );

	        it( "should call createNode", () => {
	            pluginBoundActionCreators.createNode.should.be.called();
	        } );

	        it( "should not call deleteNode", () => {
	            pluginBoundActionCreators.deleteNode.should.not.be.called();
	        } );

	        it( "should report the number of new nodes fetched and deleted", () => {
	            pluginReporter.info.should.be.calledTwice();
	            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 2 new nodes" );
	            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
	        } );

	        it( "should call setPluginStatus once", () => {
	            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
	        } );
	    } );

	    describe( "when exportToJson is enabled", () => {
	        before( () => {
	            pluginOptions.exportToJson.enabled = true;
	        } );

	        after( () => {
				pluginOptions.exportToJson.enabled = false;
	        } );

	        it( "should export json", () => {
	        	fsWriteFileSyncStub.should.be.calledTwice();
	        } );
	    } );
	} );
} );
