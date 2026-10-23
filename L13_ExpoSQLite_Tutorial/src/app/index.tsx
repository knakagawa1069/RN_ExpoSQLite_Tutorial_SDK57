import ItemRow from "@/components/ItemRow";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
//the actual component we need to import from react native element
import { Dropdown } from "react-native-element-dropdown";
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import {
  fetchItems,
  insertItem,
  updateItem,
  deleteItem,
  sortAsc,
  sortDesc,
  sortNumAsc,
  sortNumDesc,
  type Item,
} from "../data/db";

//general props needed for the component
interface DropdownItem {
  label: string;
  value: string;
}

export default function App() {
  /**
   * Database Access
   *
   * useSQLiteContext() hook gives us access to the database instance.
   * This works because _layout.tsx wraps the app in SQLiteProvider.
   * Without the provider, this hook would throw an error.
   */
  const db = useSQLiteContext();

  /**
   * Form State
   *
   * These state variables control the input fields (controlled components).
   * They're stored as strings because TextInput always works with strings.
   */
  const [name, setName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // manages component state
  // value is, well, the current value selected
  // isFocus is constantly checking whether or not
  // the dropdown is currently selected.
  //may be retconned later.
  // https://www.google.com/search?gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIHCAEQIRigATIHCAIQIRigATIHCAMQIRigATIHCAQQIRigATIHCAUQIRigATIHCAYQIRirAjIHCAcQIRiPAjIHCAgQIRiPAjIHCAkQIRiPAtIBCDg0MDBqMWo3qAIAsAIA&ie=UTF-8&oq=how+to+make+a+dropdown+in+react+native+typescir%5Br&q=how+to+make+a+dropdown+in+react+native+typescir%5Br&safe=active&source=chrome.ob&sourceid=chrome&surl=1&mstk=AUtExfA1T9Ir_AOf2X4Y8HsyRrvZZpkvbLdQGJuPwUGfP8pF_554ydB6qWeOh3qsvXkdua6xPsKgCF06lmJf6NJt9PnzVjnJCAiQkZBx90hltIiBLMzBWBHQTbPWhAc3dOa7cbmvYbyOQ4xsBoknISfshrYfvc12wi8&csuir=1&aioh=3&mtid=3d3YarfIIPGjptQP2a7MqQo&udm=50#aof=1
  const [value, setValue] = useState<string | null>(null);

  const data: DropdownItem[] = [
    { label: "Option 1", value: "1" },
    { label: "Option 2", value: "2" },
    { label: "Option 3", value: "3" },
    { label: "Option 4", value: "4" },
  ];
  /**
   * Database State
   *
   * Stores the items retrieved from the database.
   * When this updates, React re-renders the FlatList to show the new data.
   */
  const [items, setItems] = useState<Item[]>([]);

  /**
   * Load Items on Mount
   *
   * useEffect with empty dependency array [] runs once when component mounts.
   * This is the perfect place to load initial data from the database.
   *
   * Note: VSCode may warn about missing 'loadItems' dependency.
   * We intentionally omit it because we only want this to run once on mount,
   * not every time loadItems function is redefined.
   */
  useEffect(() => {
    loadItems();
  }, []);

  /**
   * Load Items Function
   *
   * Fetches all items from the database and updates the local `items` state.
   *
   * This function is called when the component first mounts (via useEffect)
   * and whenever data changes (after an insert, update, or delete operation).
   *
   * The fetched data is stored in state so the FlatList automatically re-renders
   * to reflect the latest information from the database.
   *
   * @returns Promise that resolves when items are successfully loaded
   */
  const loadItems = async () => {
    try {
      const value = await fetchItems(db);
      setItems(value);
    } catch (err) {
      console.log("Failed to fetch items", err);
    }
  };

  /**
   * Save or Update Item Function
   *
   * Validates user input, then either inserts a new record or updates
   * an existing record depending on whether `editingId` is null.
   *
   * Validation Steps:
   * 1. Ensure the name is not empty (after trimming whitespace)
   * 2. Parse quantity as an integer
   * 3. Ensure quantity is a valid number (not NaN)
   *
   * Workflow:
   * - If no item is being edited (editingId is null), insert a new item.
   * - If an item is being edited, update that record in the database.
   *
   * After successful operation:
   * - The list of items is refreshed from the database
   * - Form fields and editing state are cleared
   *
   * @returns Promise that resolves when the save or update completes
   */
  const saveOrUpdate = async () => {
    if (!name.trim()) return;
    const parsedQuantity = parseInt(quantity, 10);
    if (Number.isNaN(parsedQuantity)) return;

    try {
      if (editingId === null) {
        await insertItem(db, name.trim(), parsedQuantity);
      } else {
        await updateItem(db, editingId, name.trim(), parsedQuantity);
      }
      await loadItems();
      setName("");
      setQuantity("");
      setEditingId(null);
    } catch (err) {
      console.log("Failed to save/update item", err);
    }
  };

  //sorts by alphabetical: non-case sensitive
  const sortAscending = async () => {
    try {
      const value = await sortAsc(db);
      setItems(value);
    } catch {
      console.log("idk");
    }
  };

  //sorts by alphabetical: reverse non-case sensitive
  const sortDescending = async () => {
    try {
      const value = await sortDesc(db);
      setItems(value);
    } catch {
      console.log("idk");
    }
  };

  //sorts by numerical (the quantity): ascending
  const sortNumAscending = async () => {
    try {
      const value = await sortNumAsc(db);
      setItems(value);
    } catch {
      console.log("idk");
    }
  };

  //sorts by numerical (the quantity): descending
  const sortNumDescending = async () => {
    try {
      const value = await sortNumDesc(db);
      setItems(value);
    } catch {
      console.log("idk");
    }
  };

  /**
   * Start Edit Function
   *
   * Prepares the form for editing an existing item.
   *
   * When a user taps the "Edit" button, this function:
   * - Saves the selected item's `id` in state (editingId)
   * - Populates the input fields (`name` and `quantity`)
   *   so the user can modify existing values
   *
   * Once editing is complete and the user taps "Update Item",
   * the `saveOrUpdate` function will handle saving the changes.
   *
   * @param item - The item object that the user selected to edit
   * @returns void
   */
  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setName(item.name);
    setQuantity(String(item.quantity));
  };

  /**
   * Confirm Delete Function
   *
   * Displays a confirmation dialog before deleting an item from the database.
   *
   * Workflow:
   * 1. Shows an alert asking the user to confirm deletion.
   * 2. If the user confirms, deletes the item using its `id`.
   * 3. Reloads the item list to reflect the change.
   * 4. If the deleted item was currently being edited, clears the form.
   *
   * This confirmation step helps prevent accidental deletions.
   *
   * @param id - The unique identifier of the item to delete
   * @returns void
   */
  const confirmDelete = (id: number) => {
    Alert.alert("Delete item?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteItem(db, id);
            await loadItems();
            if (editingId === id) {
              setEditingId(null);
              setName("");
              setQuantity("");
            }
          } catch (err) {
            console.log("Failed to delete item", err);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SQLite Example</Text>
      <TextInput
        style={styles.input}
        placeholder="Item Name"
        value={name}
        onChangeText={setName}
      />

      {/* 
        Quantity Input
        
        keyboardType="numeric" shows a number keyboard on mobile devices.
        Note: This doesn't prevent non-numeric input, so we still validate in saveItem().
      */}

      <TextInput
        style={styles.input}
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      {/* 
        Save Button
        Triggers the saveOrUpdate function which validates and saves to database.
      */}

      <View style={styles.dropdownContainer}>
        <Dropdown
          style={[styles.dropdown]}
          data={data}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={"Select item"}
          searchPlaceholder="Search..."
          value={value}
          //calls function, which will then determine which option is selected
          //primary code for calling functions extracted from gemini:
          //https://www.google.com/search?gs_lcrp=EgZjaHJvbWUyBggAEEUYOdIBCTEzMDA1ajFqN6gCALACAA&ie=UTF-8&oq=react+native+element%2C+how+to+call+a+function+if+a+certain+value+is+pressed+in+dropdown&q=react+native+element%2C+how+to+call+a+function+if+a+certain+value+is+pressed+in+dropdown&safe=active&source=chrome.ob&sourceid=chrome&surl=1&mstk=AUtExfDWV37OGecQHQ5I9VoH2y-LQ4Qn3L-H1WTLGTrVEb9GrKAtmou2dVwvOAMNUCEf1eBhZhUxqjNwpJ0nE-OCgJFEX9c83Z-BMxI8b4YNymdQKUhvpR1wPsrdAOCbrX01oWIvrYhLJuXjiQJDAhJV8ekkvStg2xg&csuir=1&udm=50&aioh=3&mtid=Ri3aatTxIZ2B5OMPrpjL8A0#aof=1
          onChange={(item: DropdownItem) => {
            setValue(item.value);

            //name ascending
            if (item.value == "1") {
              sortAscending();

              //name descending
            } else if (item.value == "2") {
              sortDescending();
            }

            //number ascending
            else if (item.value == "3") {
              sortNumAscending();
            } else if (item.value == "4") {
              sortNumDescending();
            }
          }}
        />
      </View>

      <Button
        title={editingId === null ? "Save Item" : "Update Item"}
        onPress={saveOrUpdate}
      />

      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => item.id.toString()}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: 1,
              backgroundColor: "#eee",
              marginLeft: 14,
              marginRight: 14,
            }}
          />
        )}
        renderItem={({ item }) => (
          <ItemRow
            name={item.name}
            quantity={item.quantity}
            onEdit={() => startEdit(item)}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 24, color: "#888" }}>
            No items yet. Add your first one above.
          </Text>
        }
        contentContainerStyle={
          items.length === 0
            ? { flexGrow: 1, justifyContent: "center" }
            : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  dropdownContainer: {
    backgroundColor: "white",
    padding: 16,
    width: "100%",
  },

  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
  },
  list: {
    marginTop: 20,
    width: "100%",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});
