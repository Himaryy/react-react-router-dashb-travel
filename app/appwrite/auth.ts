import { ID, OAuthProvider, Query } from "appwrite";
import { account, appwriteConfig, database } from "./client";
import { redirect } from "react-router";

export const loginWithGoogle = async () => {
  try {
    account.createOAuth2Session(OAuthProvider.Google);
  } catch (error) {
    console.log("Login With Google : ", error);
  }
};

export const getUser = async () => {
  try {
    const user = await account.get();

    if (!user) return redirect("/sign-in");

    const { documents } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [
        Query.equal("accountId", user.$id),
        Query.select(["name", "email", "imageUrl", "joinedAt", "accountId"]),
      ]
    );
  } catch (error) {
    console.log(error);
  }
};

export const logoutUser = async () => {
  try {
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.log("Logout User Error: ", error);
    return false;
  }
};

export const getGooglePicture = async () => {
  try {
    const session = await account.getSession("current");

    const oAuthToken = session.providerAccessToken;

    if (!oAuthToken) {
      console.log("No oAuth Token Available");
      return null;
    }

    // Make a request to the google people api to get profile photo
    const response = await fetch(
      "https://people.googleapis.com/v1/people/me?personFields=photos",
      {
        headers: {
          Authorization: `Bearer ${oAuthToken}`,
        },
      }
    );

    if (!response.ok) {
      console.log("Failed to Get Profile Photo");
      return null;
    }

    // IF Success or OK
    const data = await response.json();

    // Extract profile photo from the response
    const photoUrl =
      data.photos && data.photos.length > 0 ? data.photos[0].url : null;

    return photoUrl;
  } catch (error) {
    console.log("getGooglePeople error : ", error);
    return null;
  }
};

export const storeUserData = async () => {
  try {
    const user = await account.get();

    if (!user) return null;

    // check if user already exist in the database
    const { documents } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", user.$id)]
    );

    if (documents.length > 0) return documents[0];

    // else
    // create new user doucment
    const imageUrl = await getGooglePicture();

    const newUser = await database.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        accountId: user.$id,
        email: user.email,
        name: user.name,
        imageUrl: imageUrl || "",
        joinedAt: new Date().toISOString,
      }
    );

    return newUser;
  } catch (error) {
    console.log("Failed to Store Data: ", error);
    return null;
  }
};

export const getExistingUser = async () => {
  try {
    const user = await account.get();

    if (!user) return null;

    // check if user exist in the databse
    const { documents } = await database.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", user.$id)]
    );

    if (documents.length === 0) return null;
  } catch (error) {
    console.log("Error Fetching User: ", error);
    return null;
  }
};
