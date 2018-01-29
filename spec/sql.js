require( "./helpers/setup" );

describe( "sql", function() {
    let sql, seriateStub, logStub;

    let sqlShouldResolve = true;

    const config = {
        "server": "localhost",
        "user": "username",
        "password": "password",
        "database": "databass"
    };

    const data = [
        {
            id: "123",
            title: "first post",
            postBody: "<b>I am a post body</b>",
            createdOn: "2017-08-04 05:58:02.563",
            modifiedOn: "2017-08-04 05:58:02.563",
            contentType: "text/html",
            slug: "first-post",
            tagList: "node,npm",
            categoryName: "Blog",
            modifiedBy: "dan",
            createdBy: "dan",
            publishedOn: "2017-08-04 05:58:02.563"
         },
         {
            id: "456",
            title: "second post",
            postBody: "<b>I am a post body</b>",
            createdOn: "2017-08-04 05:58:02.563",
            modifiedOn: "2017-08-04 05:58:02.563",
            contentType: "text/html",
            slug: "second-post",
            tagList: "node,npm",
            categoryName: "Blog",
            modifiedBy: "dan",
            createdBy: "dan",
            publishedOn: "2017-08-04 05:58:02.563"
         },
    ];

    beforeEach( () => {
        logStub = {
            error: sinon.stub()
        };
        seriateStub = {
            setDefaultConfig: sinon.stub(),
            execute: ( sqlShouldResolve ) ? sinon.stub().resolves( data ) : sinon.stub().rejects( "An error occured" )
        };
        const Sql = proxyquire( "../../src/sql.js", {
            seriate: seriateStub
        } );
        sql = Sql( config, logStub );
    } );

    afterEach( () => {
        seriateStub.setDefaultConfig.reset();
        logStub.error.reset();
    } );

    describe( "when initialized", () => {
        it( "sets config for seriate", () => {
            seriateStub.setDefaultConfig.should.be.calledOnce();
            seriateStub.setDefaultConfig.getCall( 0 ).args[ 0 ].should.equal( config );
        } );
    } );

    describe( "when calling getNewPosts", () => {
        let posts;

        beforeEach( () => {
            posts = sql.getNewPosts( { categoryId: 2 }, Date.now() );
        } );

        it( "returns posts", () => {
            return posts.then( ( dat ) => {
                dat.length.should.equal( 2 );
            } );
        } );

        it( "executes query", () => {
            seriateStub.execute.should.be.calledOnce();
        } );
    } );

    describe( "when calling getNewPosts with no lastFetched param", () => {
        let posts;

        beforeEach( () => {
            posts = sql.getNewPosts();
        } );

        it( "returns posts", () => {
            return posts.then( ( dat ) => {
                dat.length.should.equal( 2 );
            } );
        } );

        it( "executes query", () => {
            seriateStub.execute.should.be.calledOnce();
        } );
    } );

    describe( "when sql errors when calling getNewPosts", () => {
        before( () => {
            sqlShouldResolve = false;
        } );

        after( () => {
            sqlShouldResolve = true;
        } );

        beforeEach( () => {
            posts = sql.getNewPosts( { categoryId: 2 }, Date.now() );
        } );

        it( "returns null for posts", () => {
            posts.should.eventually.be.null();
        } );

        it( "should log error", () => {
            return posts.then( () => {
                logStub.error.should.be.calledOnce();
            } );
        } );
    } );

    describe( "when calling getDeletedPosts", () => {
        let posts;

        beforeEach( () => {
            posts = sql.getDeletedPosts( null, Date.now() );
        } );

        it( "returns posts", () => {
            return posts.then( ( dat ) => {
                dat.length.should.equal( 2 );
            } );
        } );

        it( "executes query", () => {
            seriateStub.execute.should.be.calledOnce();
        } );
    } );

    describe( "when calling getDeletedPosts with null lastFetched arg", () => {
        let posts;

        beforeEach( () => {
            posts = sql.getDeletedPosts( { categoryId: 2 }, null );
        } );

        it( "returns null for posts", () => {
            posts.should.eventually.be.null();
        } );

        it( "should not execute query", () => {
            seriateStub.execute.should.not.be.called();
        } );
    } );

    describe( "when calling getDeletedPosts with no lastFetched arg", () => {
        let posts;

        beforeEach( () => {
            posts = sql.getDeletedPosts();
        } );

        it( "returns null for posts", () => {
            posts.should.eventually.be.null();
        } );

        it( "should not execute query", () => {
            seriateStub.execute.should.not.be.called();
        } );
    } );

    describe( "when sql errors when calling getDeletedPosts", () => {
        before( () => {
            sqlShouldResolve = false;
        } );

        after( () => {
            sqlShouldResolve = true;
        } );

        beforeEach( () => {
            posts = sql.getDeletedPosts( { categoryId: 2 }, Date.now() );
        } );

        it( "returns null for posts", () => {
            posts.should.eventually.be.null();
        } );

        it( "should log error", () => {
            return posts.then( () => {
                logStub.error.should.be.calledOnce();
            } );
        } );
    } );
} );
