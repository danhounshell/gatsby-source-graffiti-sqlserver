const crypto = require( "crypto" );
const SQL = require( "./sql" );
const staticData = require( "./static.json" );

const transformPostToNode = ( post ) => {
    let internal = {
        type: "GraffitiBlogPost",
        mediaType: post.contentType,
        content: post.postBody,
        contentDigest: crypto.createHash( "md5" ).update( JSON.stringify( post ) ).digest( "hex" )
    }
    // Stringify date objects
    return JSON.parse(
        JSON.stringify( {
            id: post.id,
            parent: null,
            children: [],
            internal,
            title: post.title,
            publishedOn: post.publishedOn,
            slug: post.slug,
            content: post.postBody,
            tags: post.tagList.split(","),
            categoryName: post.categoryName,
            createdBy: post.createdBy
        } )
    );
}

exports.sourceNodes = async ( { boundActionCreators, reporter, store }, pluginOptions ) => {
    const { createNode, deleteNode, setPluginStatus } = boundActionCreators;

    const sql = ( pluginOptions.offlineMode ) ?
    	null :
    	SQL( pluginOptions.sql, reporter );

    let lastFetchedPosts, lastDeletedPosts;
    if ( store && store.getState() && store.getState().status && store.getState().status.plugins &&
        store.getState().status.plugins[`gatsby-source-graffiti-sqlserver`] )
    {
        const thisPlugin = store.getState().status.plugins[`gatsby-source-graffiti-sqlserver`];
        if ( thisPlugin.status ) {
            lastFetchedPosts = thisPlugin.status.lastFetchedPosts;
            lastDeletedPosts = thisPlugin.status.lastDeletedPosts;
        }
    }

    // get only posts modified since last check
    let newPosts = ( pluginOptions.offlineMode ) ?
    	staticData :
    	await sql.getNewPosts( pluginOptions.query, lastFetchedPosts );
    if ( newPosts && newPosts.length > 0 ) {
        newPosts.forEach( post => {
            createNode( transformPostToNode( post ) );
        } );
        reporter.info( `fetched ${ newPosts.length } new nodes`)
        setPluginStatus( { lastFetchedPosts: Date.now() } );
    } else {
        reporter.info( "fetched 0 new nodes" );
    }

    // delete any nodes where post has been deleted since last check
    if ( lastDeletedPosts ) {
        let deletedPosts = ( pluginOptions.offlineMode ) ?
       		null :
       		await sql.getDeletedPosts( pluginOptions.query, lastDeletedPosts );
        if ( deletedPosts && deletedPosts.length > 0 ) {
            deletedPosts.forEach( post => {
                let node = transformPostToNode( post );
                deleteNode( node.id, node );
            } );
            reporter.info( `deleted ${ deletedPosts.length } nodes`)
            setPluginStatus( { lastDeletedPosts: Date.now() } );
        } else {
            reporter.info( "deleted 0 nodes" );
        }
    } else {
        // this has never been run before so there should be no existing nodes to delete
        reporter.info( "deleted 0 nodes" );
    }
  };
