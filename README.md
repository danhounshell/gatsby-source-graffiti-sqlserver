# Gatsby plugin that pulls blog posts out of a Graffiti SQL Server database

## Configuration:

    {
    	resolve: "gatsby-source-graffiti-sqlserver",
      	options: {
      		sql: {
      			server: "databass server",
      			user: "username",
      			password: "password",
      			database: "my_databass"
      		},
      		query: {
      			categoryId: null, // will only get posts from that category id when set
      			includeComments: false
      		},
      		offlineMode: false, // for testing when true will use static data instead of hitting your db
      		excerptLength: 250
      	}
    }

## Query:

    graphql(
    	`{ allGraffitiBlogPost(
    		sort:{ fields:publishedOn, order:DESC},
    		filter:{ category:{ ne:\"\" } } ) {
    			totalCount
    			edges {
    				node {
    					id
    					slug
    					title
    					publishedOn
    					category
    					createdBy
    					tags
    					content
    					excerpt
    					comments {
          					id
          					content
          					publishedOn
          					author
          					authorUrl
          				}
    				}
    			}
    		}
    	}`
    )

and

    graphql`
      query PostById($id: String!) {
    	graffitiBlogPost( id: { eq: $id } ) {
    		id
    		title
    		content
    		createdBy
    		category
    		publishedOn
    		excerpt
    		tags
    		slug
    		comments {
          		id
          		content
          		publishedOn
          		author
          		authorUrl
          	}
    	}
    `

