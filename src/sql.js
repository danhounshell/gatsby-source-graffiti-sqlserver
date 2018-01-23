const sql = require( "seriate" );

let log;

const getNewPosts = ( queryOptions, lastFetched ) => {
    let query = `SELECT p.Title as title, p.PostBody as postBody, p.CreatedOn as createdOn, p.ModifiedOn as modifiedOn, p.Published as publishedOn, p.Content_Type as contentType, p.Name as name, p.Tag_List as tagList, c.Name as categoryName, p.ModifiedBy as modifiedBy, p.CreatedBy as createdBy, p.UniqueId as id FROM graffiti_posts p INNER JOIN graffiti_Categories c ON p.CategoryId = c.Id WHERE p.IsPublished=1 AND p.IsDeleted=0 AND c.IsDeleted=0 AND p.CategoryId = ${ queryOptions.categoryId }`;
    if ( lastFetched ) {
        query+= ` AND p.ModifiedOn > '${ new Date( lastFetched ).toISOString() }'`;
    }
    query += " ORDER BY CreatedOn DESC;";

    return executeQuery( query );
};

const getDeletedPosts = ( queryOptions, lastFetched ) => {
    if ( lastFetched ) {
        let query = `SELECT p.Title as title, p.PostBody as postBody, p.CreatedOn as createdOn, p.ModifiedOn as modifiedOn, p.Published as publishedOn, p.Content_Type as contentType, p.Name as name, p.Tag_List as tagList, c.Name as categoryName, p.ModifiedBy as modifiedBy, p.CreatedBy as createdBy, p.UniqueId as id FROM graffiti_posts p INNER JOIN graffiti_Categories c ON p.CategoryId = c.Id WHERE ( p.IsPublished=0 OR p.IsDeleted=1 OR c.IsDeleted=1 ) AND p.CategoryId = ${ queryOptions.categoryId } AND p.ModifiedOn > '${ new Date( lastFetched ).toISOString() }' ORDER BY CreatedOn DESC;`;    
        return executeQuery( query );
    } else {
        // this has never been run before so there should be no existing nodes to delete
        return new Promise( ( resolve ) => { return resolve( null ); } );
    }
};

const executeQuery = ( query ) => {
    return sql.execute( { 
        query: query
    } ).then( results => {
        return results;
    }).catch( err => {
        log.error( err );
        return null;
    } );
};

module.exports = function( config, logger ) { 
    sql.setDefaultConfig( config );
    log = logger;
    return {
        getNewPosts, 
        getDeletedPosts
    };
};