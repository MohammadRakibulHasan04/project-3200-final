import { ID, Query } from 'react-native-appwrite';
import { categories } from '../data/categories';
import { appwriteConfig, databases } from './appwrite';

export const seedCategories = async () => {
  try {
    // Check if categories already exist to avoid duplicates
    // This is a naive check (checking if any exist). 
    const existing = await databases.listDocuments(
        appwriteConfig.databaseId!,
        appwriteConfig.categoriesCollectionId!,
        [Query.limit(1)]
    );

    if (existing.documents.length > 0) {
        console.log('Categories already seeded');
        return;
    }

    const promises = categories.map(async (cat) => {
       try {
         await databases.createDocument(
            appwriteConfig.databaseId!,
            appwriteConfig.categoriesCollectionId!,
            ID.unique(),
            {
                name: cat.name,
                parentId: cat.parentId,
                type: cat.type,
                originalId: cat.id // storing the static ID to link them easier in logic if needed
            }
         );
       } catch (e) {
         console.log('Error creating category:', cat.name, e);
       }
    });

    await Promise.all(promises);
    console.log('Seeding completed');
  } catch (error) {
    console.log('Seeding failed:', error);
  }
}
