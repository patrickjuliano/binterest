const {ApolloServer, gql} = require('apollo-server');
const uuid = require('uuid');
const axios = require('axios');
const { apiEndpoint, apiKey } = require('./config');
const redis = require('redis');
const client = redis.createClient();
const flat = require('flat');
const unflatten = flat.unflatten;

const typeDefs = gql`
    type Query {
        unsplashImages(pageNum: Int): [ImagePost]
        binnedImages: [ImagePost]
        userPostedImages: [ImagePost]
    }

    type ImagePost {
        id: ID!
        url: String!
        posterName: String!
        description: String
        userPosted: Boolean!
        binned: Boolean!
    }

    type Mutation {
        uploadImage(
            url: String!
            description: String
            posterName: String
        ): ImagePost
        updateImage(
            id: ID!
            url: String
            posterName: String
            description: String
            userPosted: Boolean
            binned: Boolean
        ): ImagePost
        deleteImage(id: ID!): ImagePost
    }
`;

const resolvers = {
    Query: {
        unsplashImages: async (_, args) => {
            const { data: data } = await axios.get(`${apiEndpoint}?client_id=${apiKey}${args.pageNum ? `&page=${args.pageNum}` : ''}`);
            const imagePosts = [];
            for (const image of data) {
                const imagePost = await client.hGet('imagePosts', image.id);
                imagePosts.push({
                    id: image.id,
                    url: image.urls && image.urls.raw ? image.urls.raw : 'N/A',
                    posterName: image.user.name ? image.user.name : (image.user.username ? image.user.username : 'N/A'),
                    description: image.description ? image.description : 'N/A',
                    userPosted: false,
                    binned: !!imagePost
                });
            }
            return imagePosts;
        },
        binnedImages: async () => {
            const imagePosts = await client.hGetAll('imagePosts');
            if (imagePosts) {
                const data = Object.values(imagePosts);
                for (let i = 0; i < data.length; i++) {
                    data[i] = unflatten(JSON.parse(data[i]));
                }
                const filteredData = data.filter((imagePost) => imagePost.binned === true);
                return filteredData;
            } else {
                throw 'Could not get ImagePosts';
            }
        },
        userPostedImages: async () => {
            const imagePosts = await client.hGetAll('imagePosts');
            if (imagePosts) {
                const data = Object.values(imagePosts);
                for (let i = 0; i < data.length; i++) {
                    data[i] = unflatten(JSON.parse(data[i]));
                }
                const filteredData = data.filter((imagePost) => imagePost.userPosted === true);
                return filteredData;
            } else {
                throw 'Could not get ImagePosts';
            }
        }
    },
    Mutation: {
        uploadImage: async (_, args) => {
            const imagePost = {
                id: uuid.v4(),
                url: args.url,
                posterName: args.posterName ? args.posterName : 'N/A',
                description: args.description ? args.description : 'N/A',
                userPosted: true,
                binned: false
            }
            const flatData = flat(imagePost);
            await client.hSet('imagePosts', imagePost.id, JSON.stringify(flatData));
            return imagePost;
        },
        updateImage: async (_, args) => {
            const imagePost = await client.hGet('imagePosts', args.id);
            if (imagePost) { // ImagePost found in cache
                const data = JSON.parse(imagePost);
                if ('binned' in args) {
                    data.binned = args.binned;
                    if (!data.userPosted && !data.binned) { // Unsplash ImagePost unbinned
                        await client.hDel('imagePosts', args.id);
                    } else { // Unsplash ImagePost binned or user-posted ImagePost
                        const flatData = flat(data);
                        await client.hSet('imagePosts', args.id, JSON.stringify(flatData));
                    }
                    return data;
                } else {
                    return imagePost;
                }
            } else { // ImagePost not found in cache
                const { data } = await axios.get(`${apiEndpoint}/${args.id}?client_id=${apiKey}`);
                const imagePost = {
                    id: data.id,
                    url: data.urls && data.urls.raw ? data.urls.raw : 'N/A',
                    posterName: data.user.name ? data.user.name : (data.user.username ? data.user.username : 'N/A'),
                    description: data.description ? data.description : 'N/A',
                    userPosted: false,
                    binned: 'binned' in args ? args.binned : true
                }
                if (imagePost.binned) {
                    const flatData = flat(imagePost);
                    await client.hSet('imagePosts', imagePost.id, JSON.stringify(flatData));
                }
                return imagePost;
            }
        },
        deleteImage: async (_, args) => {
            const imagePost = await client.hGet('imagePosts', args.id);
            if (imagePost) { // ImagePost found in cache
                const data = JSON.parse(imagePost);
                const result = await client.hDel('imagePosts', args.id);
                if (result === 0) throw `Could not delete ImagePost with id of ${args.id}`
                return data;
            } else { // ImagePost not found in cache
                throw `Could not delete ImagePost with id of ${args.id}`;
            }
        }
    }
};

const server = new ApolloServer({typeDefs, resolvers});

server.listen().then(async ({url}) => {
    await client.connect();
    console.log(`🚀 Server ready at ${url} 🚀`);
});