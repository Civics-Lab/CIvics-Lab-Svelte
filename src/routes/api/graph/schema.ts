export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String
    role: String!
    createdAt: String!
    updatedAt: String!
    lastLoginAt: String
  }

  type Workspace {
    id: ID!
    name: String!
    slug: String!
    owner: User!
    createdAt: String!
    updatedAt: String!
    settings: String
    members: [WorkspaceUser!]!
  }

  type WorkspaceUser {
    id: ID!
    workspace: Workspace!
    user: User!
    role: String!
    createdAt: String!
    updatedAt: String!
  }

  type Contact {
    id: ID!
    workspaceId: ID!
    firstName: String!
    lastName: String!
    email: String
    phone: String
    address: String
    notes: String
    createdAt: String!
    updatedAt: String!
    createdBy: User
  }

  type Business {
    id: ID!
    workspaceId: ID!
    name: String!
    address: String
    phone: String
    email: String
    website: String
    industry: String
    notes: String
    createdAt: String!
    updatedAt: String!
    createdBy: User
  }

  type Donation {
    id: ID!
    workspaceId: ID!
    amount: Int!
    date: String!
    donorType: String!
    donorId: ID!
    campaign: String
    notes: String
    createdAt: String!
    updatedAt: String!
    createdBy: User
  }

  input WorkspaceUserInput {
    userId: ID!
    role: String!
  }

  input ContactInput {
    workspaceId: ID!
    firstName: String!
    lastName: String!
    email: String
    phone: String
    address: String
    notes: String
  }

  input BusinessInput {
    workspaceId: ID!
    name: String!
    address: String
    phone: String
    email: String
    website: String
    industry: String
    notes: String
  }

  input DonationInput {
    workspaceId: ID!
    amount: Int!
    date: String!
    donorType: String!
    donorId: ID!
    campaign: String
    notes: String
  }

  input WorkspaceInput {
    name: String!
    slug: String!
    settings: String
  }

  type Query {
    # User queries
    me: User!
    user(id: ID!): User
    workspaceUsers(workspaceId: ID!): [User!]!
    
    # Workspace queries
    workspace(id: ID!): Workspace
    myWorkspaces: [Workspace!]!
    
    # Contact queries
    contact(id: ID!): Contact
    workspaceContacts(workspaceId: ID!): [Contact!]!
    
    # Business queries
    business(id: ID!): Business
    workspaceBusinesses(workspaceId: ID!): [Business!]!
    
    # Donation queries
    donation(id: ID!): Donation
    workspaceDonations(workspaceId: ID!): [Donation!]!
  }

  type Mutation {
    # Workspace mutations
    createWorkspace(input: WorkspaceInput!): Workspace!
    updateWorkspace(id: ID!, input: WorkspaceInput!): Workspace!
    deleteWorkspace(id: ID!): Boolean!
    addWorkspaceMember(workspaceId: ID!, input: WorkspaceUserInput!): WorkspaceUser!
    removeWorkspaceMember(workspaceId: ID!, userId: ID!): Boolean!
    
    # Contact mutations
    createContact(input: ContactInput!): Contact!
    updateContact(id: ID!, input: ContactInput!): Contact!
    deleteContact(id: ID!): Boolean!
    
    # Business mutations
    createBusiness(input: BusinessInput!): Business!
    updateBusiness(id: ID!, input: BusinessInput!): Business!
    deleteBusiness(id: ID!): Boolean!
    
    # Donation mutations
    createDonation(input: DonationInput!): Donation!
    updateDonation(id: ID!, input: DonationInput!): Donation!
    deleteDonation(id: ID!): Boolean!
  }
`;
