const _ = require( "lodash" );
const crypto = require( "crypto" );
const htmlToText = require( "html-to-text" );

module.exports = ( post, options ) => {
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
