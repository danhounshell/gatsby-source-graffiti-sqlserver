const _ = require( "lodash" );
const crypto = require( "crypto" );
const fs = require("fs");
const htmlToText = require( "html-to-text" );
const path = require( "path" );
const SQL = require( "./sqlDataSource" );
const json = require( "./jsonDataSource" );
const staticData = require( "./staticDataSource.json" );

const writeNodeToJson = ( post, options ) => {
	if ( options.dataSource.type === "sql" && options.exportToJson && options.exportToJson.enabled && options.exportToJson.path ) {
		const postDate = new Date( post.publishedOn );
		const fileTitle = postDate.getFullYear() + "-" + ( "0" + ( postDate.getMonth() + 1 ) ).slice( -2 ) + "-" + ( "0" + postDate.getDate() ).slice( -2 ) + "-" + _.kebabCase( post.slug ) + ".json";
		const filePath = path.join( options.exportToJson.path, `/${ fileTitle }` );
		const fileAlreadyExists = fs.existsSync( filePath );
		if ( options.exportToJson.overwriteExisting || !fileAlreadyExists ) {
			fs.writeFileSync( filePath, JSON.stringify( post, null, 4 ), "utf8" )
		}
	}
};

// remove json file

const transformPostToNode = ( post, options ) => {
    const internal = {
        type: "GraffitiBlogPost",
        mediaType: post.contentType,
        contentDigest: crypto.createHash( "md5" ).update( JSON.stringify( post ) ).digest( "hex" )
    }

    if ( post.comments && post.comments.length > 0 ) {
    	const oldComments = _.cloneDeep( post.comments );
    	post.comments = [];
    	_.each( oldComments, ( oldComment ) => {
    		const newComment = {
    			id: oldComment.id,
    			date: oldComment.publishedOn,
    			author: {
    				name: oldComment.author,
    				url: oldComment.authorUrl
    			},
    			html: oldComment.content,
    			isTrackback: oldComment.isTrackback
    		}
    		post.comments.push( newComment );
    	} );
    }

    let newPostBody = post.postBody;
	if ( options.replaceStrings ) {
		_.each( options.replaceStrings, ( replaceString ) => {
			const regex = new RegExp( replaceString.source, "g" );
			newPostBody = newPostBody.replace( regex, replaceString.value );
		} );
	}

    let cover = "";
	const regex = /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/g;
	const regexResults = regex.exec( newPostBody );
	if ( regexResults ) {
		cover = regexResults[ 1 ];
	}

	const node = {
        id: post.id,
    	ids: [ post.id, "" ],
    	internal,
        parent: null,
        children: [],
        html: newPostBody,
        slug: _.kebabCase( post.slug ),
        author: { name: post.createdBy },
        comments: post.comments,
    	frontmatter: {
    		title: post.title,
            date: post.publishedOn,
            description: _.truncate(
            	htmlToText.fromString(
            		newPostBody,
            		{
            			ignoreHref: true,
            			ignoreImage: true
            		}
            	),
            	{
            		length: options.descriptionLength,
            		separator: " "
            	}
            ),
			tags: post.tags.split(","),
            layout: ( post.category.trim().toLowerCase() === "uncategorized" ) ? "page" : "post",
            category: post.category,
            cover: cover,
            draft: false
    	}
    }

    // Stringify date objects
    return JSON.parse( JSON.stringify( node ) );
}

exports.sourceNodes = async ( { boundActionCreators, reporter, store }, pluginOptions ) => {
	const defaultOptions = {
		dataSource: {
			type: "static",
			path: "",
			server: "",
			user: "",
			password: "",
			database: ""
		},
		descriptionLength: 250,
		replaceStrings: [],
		exportToJson: {
			enabled: false,
			path: "",
			overwriteExisting: false
		},
		query: {
			categoryId: null,
			includeComments: false
		}
	}
    const { createNode, deleteNode, setPluginStatus } = boundActionCreators;
    const options = _.merge( defaultOptions, pluginOptions );

    const dataSource = ( options.dataSource.type === "static" ) ?
    	null :
    	( options.dataSource.type === "sql" ) ? SQL( options.dataSource, reporter ) :
    	json( options.dataSource, reporter );

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
    let newPosts = ( dataSource ) ?
    	await dataSource.getNewPosts( options, lastFetchedPosts ) :
    	staticData;
    if ( newPosts && newPosts.length > 0 ) {
        newPosts.forEach( post => {
			writeNodeToJson( post, options );
            createNode( transformPostToNode( post, options ) );
        } );
        reporter.info( `fetched ${ newPosts.length } new nodes`)
        setPluginStatus( { lastFetchedPosts: Date.now() } );
    } else {
        reporter.info( "fetched 0 new nodes" );
    }

    // delete any nodes where post has been deleted since last check
    if ( lastDeletedPosts ) {
        let deletedPosts = ( dataSource ) ?
       		await dataSource.getDeletedPosts( options, lastDeletedPosts ) :
       		null;
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
