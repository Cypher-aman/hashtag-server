export interface JWTUser {
  id: string;
  username: string;
}

export interface GraphQlContext {
  userSignature?: JWTUser;
}
