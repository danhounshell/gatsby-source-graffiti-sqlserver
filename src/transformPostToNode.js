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

	let images = [];
	let cover = "";
	const regex = /<img[^>]+src="?([^"\s]+)"?[^>]*\/>/g;
	let match;
	while (( match = regex.exec( newPostBody )) != null ){
		images.push( match[ 1 ] );
	}
	if ( images.length > 0 ) {
		cover = images[ 0 ];
	}

	const node = {
		id: post.id,
		internal,
		parent: null,
		children: [],
		html: newPostBody,
		slug: _.kebabCase( post.slug ),
		comments: post.comments,
		frontmatter: {
			title: post.title,
			author: { name: post.createdBy },
			date: post.publishedOn,
			description: _.truncate(
				htmlToText.fromString(
					newPostBody,
					{
						ignoreHref: true,
						ignoreImage: true,
						wordwrap: false,
						uppercaseHeadings: false,
						singleNewLineParagraphs: true
					}
				),
				{
					length: options.descriptionLength,
					separator: " "
				}
			).replace( /\n/g, " " ),
			tags: post.tags.split(","),
			layout: ( post.category.trim().toLowerCase() === "uncategorized" ) ? "page" : "post",
			category: post.category,
			images: images,
			cover: cover,
			draft: false
		}
	}

	// Stringify date objects
	return JSON.parse( JSON.stringify( node ) );
}
