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
          replaceStrings: [
            {
              source: "some string to be globally replace",
              value: "string to be used to replace the above"
            },
            {
              source: "http://www.myoldblog.com/images/photos/somelongstring/",
              value: "/files/"
            }
          ]
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
        filter:{ category:{ ne:\"\" } } )
        {
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
                cover
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
            cover
          }
        }
      }`

