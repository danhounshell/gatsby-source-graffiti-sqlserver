# Gatsby plugin that pulls blog posts out of a Graffiti SQL Server database

## Configuration:

    {
      resolve: "gatsby-source-graffiti-sqlserver",
      options: {
        dataSource: {
          type: "sql",              // sql, json or static. static returns mock data (offline mode)
          path: "./content/posts",  // path to json files
          server: "databass server",
          user: "username",
          password: "password",
          database: "my_databass"
        },
        exportToJson: {             // when using sql if enabled will write posts to json format
          enabled: false,           // at the specified path. basically for pulling data out of
          path: "./content/posts"   // sql and into local file system. Example usage: export
        }                           // posts to json and then switch data source to "json"
        replaceStrings: [ {
            source: "some string to be globally replace",
            value: "string to be used to replace the above"
          }, {
            source: "http://www.myoldblog.com/images/photos/somelongstring/",
            value: "/files/"
          }
        ],
        query: {
          categoryId: null,         // will only get posts from that category id when set
          includeComments: false
        },
        descriptionLength: 250
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

