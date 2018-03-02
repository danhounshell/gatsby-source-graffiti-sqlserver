const _ = require( "lodash" );
const transformPostToNode = require( "./transformPostToNode" );
const exportToJson = require( "./exportPostToJson" );
const SQL = require( "./sqlDataSource" );
const json = require( "./jsonDataSource" );
const staticData = require( "./staticDataSource.json" );

const writePostToJson = ( post, options ) => {
	if ( options.dataSource.type === "sql" && options.exportToJson && options.exportToJson.enabled && options.exportToJson.path ) {
		exportToJson( post, options );
	}
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
			writePostToJson( post, options );
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
				// remove json file
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
