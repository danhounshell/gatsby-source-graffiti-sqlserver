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
              ids
    					slug
              html
              author {
                name
              }
              comments {
                id
                html
                date
                author {
                  name
                  url
                }
                isTrackback
              }
              frontmatter {
                title
                date
                description
                tags
                category
                layout
                draft
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
          ids
          slug
          html
          author {
            name
          }
    		  comments {
            id
            html
            date
            author {
              name
              url
            }
            isTrackback
          }
          frontmatter {
            title
            date
            description
            tags
            category
            layout
            draft
          }
        }
      }`

