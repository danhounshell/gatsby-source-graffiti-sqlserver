require( "./helpers/setup" );

describe( "gatsby-node", function() {
    let gatsbyNode, sqlStub, sqlGetNewPosts, sqlGetDeletedPosts, pluginBoundActionCreators, pluginReporter, pluginStore;

    let sqlShouldResolve = true;
    let thisPluginIsNull = false;
    let thisPluginIsEmpty = false;
    let lastFetchedPosts = Date.now();
    let lastDeletedPosts = Date.now();

    const data = [
        {
            id: "123",
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

    let pluginOptions = {
        sql: {
            "server": "localhost",
            "user": "username",
            "password": "password",
            "database": "databass"
        },
        query: {
            categoryId: 2
        },
        offlineMode: false,
        excerptLength: 200
    };

    beforeEach( () => {
        sqlGetNewPosts = sqlShouldResolve ? sinon.stub().resolves( data ) : sinon.stub().resolves( null );
        sqlGetDeletedPosts = sqlShouldResolve ? sinon.stub().resolves( data ) : sinon.stub().resolves( null );
        sqlStub = sinon.stub().returns( {
            getNewPosts: sqlGetNewPosts,
            getDeletedPosts: sqlGetDeletedPosts
        } );
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
        gatsbyNode = proxyquire( "../../src/gatsby-node.js", {
            "./sql": sqlStub
        } );
        gatsbyNode.sourceNodes( ...inputArgs );
    } );

    afterEach( () => {
        sqlStub.reset();
        sqlGetNewPosts.reset();
        sqlGetDeletedPosts.reset();
        pluginBoundActionCreators.createNode.reset();
        pluginBoundActionCreators.deleteNode.reset();
        pluginBoundActionCreators.setPluginStatus.reset();
        pluginReporter.info.reset();
    } );

    describe( "when executing sourceNodes", () => {
        it( "should set sql config", () => {
            sqlStub.should.be.calledOnce();
            sqlStub.getCall( 0 ).args[ 0 ].server.should.equal( pluginOptions.sql.server );
            sqlStub.getCall( 0 ).args[ 0 ].user.should.equal( pluginOptions.sql.user );
            sqlStub.getCall( 0 ).args[ 0 ].password.should.equal( pluginOptions.sql.password );
            sqlStub.getCall( 0 ).args[ 0 ].database.should.equal( pluginOptions.sql.database );
        } );

        it( "should call createNode for each item returned from sql", () => {
            pluginBoundActionCreators.createNode.should.be.calledTwice();
            pluginBoundActionCreators.createNode.getCall( 0 ).args[ 0 ].title.should.equal( data[ 0 ].title );
            pluginBoundActionCreators.createNode.getCall( 1 ).args[ 0 ].title.should.equal( data[ 1 ].title );
        } );

        it( "should call deleteNode for each item returned from sql", () => {
            pluginBoundActionCreators.deleteNode.should.be.calledTwice();
            pluginBoundActionCreators.deleteNode.getCall( 0 ).args[ 0 ].should.equal( data[ 0 ].id );
            pluginBoundActionCreators.deleteNode.getCall( 0 ).args[ 1 ].title.should.equal( data[ 0 ].title );
            pluginBoundActionCreators.deleteNode.getCall( 1 ).args[ 0 ].should.equal( data[ 1 ].id );
            pluginBoundActionCreators.deleteNode.getCall( 1 ).args[ 1 ].title.should.equal( data[ 1 ].title );
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

    describe( "when using offlineMode", () => {
        before( () => {
            pluginOptions.offlineMode = true;
        } );

        after( () => {
            pluginOptions.offlineMode = false;
        } );

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
            pluginReporter.info.getCall( 0 ).args[ 0 ].should.equal( "fetched 14 new nodes" );
            pluginReporter.info.getCall( 1 ).args[ 0 ].should.equal( "deleted 0 nodes" );
        } );

        it( "should call setPluginStatus only once", () => {
            pluginBoundActionCreators.setPluginStatus.should.be.calledOnce();
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
} );
