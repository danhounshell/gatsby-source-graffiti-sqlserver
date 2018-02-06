const _ = require( "lodash" );
const crypto = require( "crypto" );
const htmlToText = require( "html-to-text" );
const SQL = require( "./sql" );
const staticData = require( "./static.json" );

const transformPostToNode = ( post, options ) => {
    let internal = {
        type: "GraffitiBlogPost",
        mediaType: post.contentType,
        contentDigest: crypto.createHash( "md5" ).update( JSON.stringify( post ) ).digest( "hex" )
    }
    // Stringify date objects
    return JSON.parse(
        JSON.stringify( {
            id: post.id,
            ids: [ post.id, "" ],
            parent: null,
            children: [],
            internal,
            title: post.title,
            publishedOn: post.publishedOn,
            slug: post.slug,
            content: post.postBody,
            excerpt: _.truncate( htmlToText.fromString( post.postBody, { ignoreHref: true, ignoreImage: true } ), { length: options.excerptLength, separator: " " } ),
            tags: post.tags.split(","),
            category: _.kebabCase( post.category ),
            createdBy: post.createdBy,
            comments: post.comments
        } )
    );
}

exports.sourceNodes = async ( { boundActionCreators, reporter, store }, pluginOptions ) => {
	const defaultOptions = {
		offlineMode: false,
		excerptLength: 255,
		sql: {},
		query: {
			categoryId: null,
			includeComments: false
		}
	}
    const { createNode, deleteNode, setPluginStatus } = boundActionCreators;
    const options = _.merge( defaultOptions, pluginOptions );

    const sql = ( options.offlineMode ) ?
    	null :
    	SQL( options.sql, reporter );

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
    let newPosts = ( options.offlineMode ) ?
    	staticData :
    	await sql.getNewPosts( options.query, lastFetchedPosts );
    if ( newPosts && newPosts.length > 0 ) {
        newPosts.forEach( post => {
            createNode( transformPostToNode( post, options ) );
        } );
        reporter.info( `fetched ${ newPosts.length } new nodes`)
        setPluginStatus( { lastFetchedPosts: Date.now() } );
    } else {
        reporter.info( "fetched 0 new nodes" );
    }

    // delete any nodes where post has been deleted since last check
    if ( lastDeletedPosts ) {
        let deletedPosts = ( options.offlineMode ) ?
       		null :
       		await sql.getDeletedPosts( options.query, lastDeletedPosts );
        if ( deletedPosts && deletedPosts.length > 0 ) {
            deletedPosts.forEach( post => {
                let node = transformPostToNode( post, options );
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
