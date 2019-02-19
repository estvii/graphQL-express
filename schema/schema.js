const graphql = require('graphql');
const _ = require('lodash');
const axios = require('axios');

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull

} = graphql;
// hard coded DB
// const users = [
//     { id: '23', firstName: 'Bill', age: 20 },
//     { id: '47', firstName: 'Samantha', age: 21 }

// ];

const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: () =>  ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        users: {
            type: new GraphQLList(UserType), //we have many users, so we need to let graphql know theres many
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
                    .then(res => res.data);
            }
        }
    })
})

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company: { 
            type: CompanyType,
            resolve(parentValue, args) {
                // console.log(parentValue, args);
                return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
                    .then(response => response.data);
            }
        }
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) { //goes into DB and actually looks for the actual data, parentValue 
                // return _.find(users, { id: args.id });
                return axios.get(`http://localhost:3000/users/${args.id}`)
                    .then(response => response.data);
            }
        },
        company: {
            type: CompanyType,
            args: { id: { type: GraphQLString } }, // the input 
            resolve(parentValue, args) {
                // console.log(parentValue,args); note there is no parentValue since the RootQuery doesnt quite have a parentNode
                return axios.get(`http://localhost:3000/companies/${args.id}`)
                    .then(response => response.data);
            }
               
        }
    }
});

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: { //describes the operation of adding user hence addUser
            type: UserType,
            args: {
                firstName: { type: new GraphQLNonNull(GraphQLString) }, //required string low level piece of validation
                age: { type: new GraphQLNonNull(GraphQLInt) },
                companyId: { type: GraphQLString }
            },
            resolve(parentValue, args) {
                const { firstName, age } = args
                // console.log(firstName,age)
                return axios.post('http://localhost:3000/users', {firstName, age})
                    .then(res => res.data);
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) }
            },
            resolve(parentValue,args) {
                // console.log(args)
                const { id } = args
                return axios.delete(`http://localhost:3000/users/${id}`)
                    .then(res => res.data);
            }
        },
        editUser: {
            type: UserType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
                firstName: { type: GraphQLString},
                age: { type: GraphQLInt},
                companyId: { type: GraphQLString }
            },
            resolve(parentValue,args) {
                const { firstName, age, id, companyId } = args
                return axios.patch(`http://localhost:3000/users/${id}`, { firstName, age, companyId }) //or you can pass args instead of {firstName, age, companyId}
                    .then(res => res.data);
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: mutation
});