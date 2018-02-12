const _ = require("lodash");
const sql = require("seriate");

let log;

const getNewPosts = ({ query: queryOptions }, lastFetched) => {
    let query = "SELECT p.Id as postId, p.Title as title, p.PostBody as postBody, p.Published as publishedOn, p.Content_Type as contentType, p.Name as slug, p.Tag_List as tags, c.Name as category, p.CreatedBy as createdBy, p.UniqueId as id FROM graffiti_posts p INNER JOIN graffiti_Categories c ON p.CategoryId = c.Id WHERE p.IsPublished=1 AND p.IsDeleted=0 AND c.IsDeleted=0";
    if (queryOptions && queryOptions.categoryId) {
        query += ` AND p.CategoryId = ${queryOptions.categoryId}`;
    }
    if (lastFetched) {
        query += ` AND p.ModifiedOn > '${new Date(lastFetched).toISOString()}'`;
    }
    query += " ORDER BY p.Published DESC;";

    return executeQuery(query).then(results => {
        if (queryOptions.includeComments) {
            let promises = [];
            _.each(results, result => {
                promises.push(getCommentsForPost(result.postId).then(comments => {
                    result.comments = comments;
                }));
            });
            return Promise.all(promises).then(() => {
                return results;
            });
        }
        return results;
    });
};

const getCommentsForPost = postId => {
    let query = "SELECT UniqueId as id, body as content, Published as publishedOn, Name as author, WebSite as authorUrl, IsTrackback as isTrackback FROM graffiti_Comments WHERE IsPublished=1 and IsDeleted=0 and PostId = " + postId + " ORDER BY Published ASC";
    return executeQuery(query);
};

const getDeletedPosts = ({ query: queryOptions }, lastFetched) => {
    if (lastFetched) {
        let query = "SELECT p.Title as title, p.PostBody as postBody, p.Published as publishedOn, p.Content_Type as contentType, p.Name as slug, p.Tag_List as tags, c.Name as category, p.CreatedBy as createdBy, p.UniqueId as id FROM graffiti_posts p INNER JOIN graffiti_Categories c ON p.CategoryId = c.Id WHERE ( p.IsPublished=0 OR p.IsDeleted=1 OR c.IsDeleted=1 )";
        if (queryOptions && queryOptions.categoryId) {
            query += ` AND p.CategoryId = ${queryOptions.categoryId}`;
        }
        query += ` AND p.ModifiedOn > '${new Date(lastFetched).toISOString()}' ORDER BY CreatedOn DESC;`;
        return executeQuery(query);
    } else {
        // this has never been run before so there should be no existing nodes to delete
        return new Promise(resolve => {
            return resolve(null);
        });
    }
};

const executeQuery = query => {
    return sql.execute({
        query: query
    }).then(results => {
        return results;
    }).catch(err => {
        log.error(err);
        return null;
    });
};

module.exports = function (config, logger) {
    sql.setDefaultConfig(config);
    log = logger;
    return {
        getNewPosts,
        getDeletedPosts
    };
};