import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // State Initialization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type IngredientId = Nat;
  type NotificationId = Nat;

  type Ingredient = {
    id : IngredientId;
    name : Text;
    quantity : Float;
    unit : Text;
    cost_price : Float;
    supplier : Text;
    low_stock_threshold : Float;
    created_at : Int;
    updated_at : Int;
  };

  type Notification = {
    id : NotificationId;
    type_ : Text;
    message : Text;
    is_read : Bool;
    created_at : Int;
  };

  type DashboardStats = {
    daily_sales : Float;
    weekly_sales : Float;
    monthly_sales : Float;
    total_revenue : Float;
    total_profit : Float;
    top_sellers : [{
      name : Text;
      units_sold : Nat;
      revenue : Float;
    }];
    recent_transactions : [{
      id : Nat;
      item : Text;
      amount : Float;
      time : Text;
    }];
  };

  public type UserProfile = {
    name : Text;
  };

  // Storage
  let ingredients = Map.empty<IngredientId, Ingredient>();
  let notifications = Map.empty<NotificationId, Notification>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ID Counters
  var nextIngredientId = 1;
  var nextNotificationId = 1;

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Seed Ingredients (called post-deployment for external seeding)
  public shared ({ caller }) func seedIngredients() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can seed ingredients");
    };

    let now = Time.now();

    let seedData = [
      ("Lettuce", 5000.0, "grams", 0.05, "Fresh Farms", 500.0),
      ("Tomatoes", 3000.0, "grams", 0.04, "Fresh Farms", 300.0),
      ("Cucumbers", 2000.0, "grams", 0.03, "Green Valley", 200.0),
      ("Carrots", 1500.0, "grams", 0.02, "Green Valley", 150.0),
      ("Cheese", 800.0, "grams", 0.5, "Dairy Best", 100.0),
      ("Croutons", 400.0, "grams", 0.3, "Bakery Co", 200.0),
      ("Olive Oil", 2.0, "kg", 250.0, "Olive Grove", 0.5),
      ("Red Onion", 1200.0, "grams", 0.02, "Fresh Farms", 150.0),
      ("Bell Peppers", 600.0, "grams", 0.08, "Green Valley", 200.0),
      ("Caesar Dressing", 1.5, "kg", 180.0, "Sauce Masters", 0.3),
    ];

    for ((name, quantity, unit, cost_price, supplier, threshold) in seedData.values()) {
      let ingredient : Ingredient = {
        id = nextIngredientId;
        name;
        quantity;
        unit;
        cost_price;
        supplier;
        low_stock_threshold = threshold;
        created_at = now;
        updated_at = now;
      };
      ingredients.add(nextIngredientId, ingredient);

      // Create low stock notifications if needed
      if (quantity <= threshold) {
        let notification : Notification = {
          id = nextNotificationId;
          type_ = "low_stock";
          message = "Ingredient '" # name # "' is low on stock!";
          is_read = false;
          created_at = now;
        };
        notifications.add(nextNotificationId, notification);
        nextNotificationId += 1;
      };

      nextIngredientId += 1;
    };
  };

  // Ingredient CRUD
  public shared ({ caller }) func addIngredient(name : Text, quantity : Float, unit : Text, cost_price : Float, supplier : Text, threshold : Float) : async IngredientId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can add ingredients");
    };

    let ingredient : Ingredient = {
      id = nextIngredientId;
      name;
      quantity;
      unit;
      cost_price;
      supplier;
      low_stock_threshold = threshold;
      created_at = Time.now();
      updated_at = Time.now();
    };
    ingredients.add(nextIngredientId, ingredient);
    let currentId = nextIngredientId;
    nextIngredientId += 1;
    currentId;
  };

  public shared ({ caller }) func updateIngredient(id : IngredientId, name : Text, quantity : Float, unit : Text, cost_price : Float, supplier : Text, threshold : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can update ingredients");
    };

    switch (ingredients.get(id)) {
      case (null) { Runtime.trap("Ingredient not found") };
      case (?ingredient) {
        let updated : Ingredient = {
          ingredient with
          name;
          quantity;
          unit;
          cost_price;
          supplier;
          low_stock_threshold = threshold;
          updated_at = Time.now();
        };
        ingredients.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteIngredient(id : IngredientId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can delete ingredients");
    };

    if (not ingredients.containsKey(id)) {
      Runtime.trap("Ingredient not found");
    };
    ingredients.remove(id);
  };

  public query ({ caller }) func getIngredients() : async [Ingredient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view ingredients");
    };
    ingredients.values().toArray();
  };

  public query ({ caller }) func getIngredient(id : IngredientId) : async Ingredient {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view ingredients");
    };
    switch (ingredients.get(id)) {
      case (null) { Runtime.trap("Ingredient not found") };
      case (?ingredient) { ingredient };
    };
  };

  // Notification System
  public query ({ caller }) func getNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };
    notifications.values().toArray();
  };

  public shared ({ caller }) func markNotificationRead(id : NotificationId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    switch (notifications.get(id)) {
      case (null) { Runtime.trap("Notification not found") };
      case (?notification) {
        let updated : Notification = {
          notification with
          is_read = true;
        };
        notifications.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func markAllNotificationsRead() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    notifications.forEach(
      func(id, notification) {
        let updated : Notification = {
          notification with
          is_read = true;
        };
        notifications.add(id, updated);
      }
    );
  };

  public query ({ caller }) func getUnreadCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notification count");
    };
    var count = 0;
    notifications.forEach(
      func(_id, notification) {
        if (not notification.is_read) { count += 1 };
      }
    );
    count;
  };

  // Inventory & Dashboard Stats
  public query ({ caller }) func getTotalInventoryValue() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inventory value");
    };
    var totalValue = 0.0;
    ingredients.forEach(
      func(_id, ingredient) {
        totalValue += ingredient.cost_price * ingredient.quantity;
      }
    );
    totalValue;
  };

  public query ({ caller }) func getLowStockIngredients() : async [Ingredient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view low stock ingredients");
    };
    let lowStockList = List.empty<Ingredient>();
    ingredients.forEach(
      func(_id, ingredient) {
        if (ingredient.quantity <= ingredient.low_stock_threshold) {
          lowStockList.add(ingredient);
        };
      }
    );
    lowStockList.toArray();
  };

  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
    };
    let daily_sales = 4500.0;
    let weekly_sales = 28000.0;
    let monthly_sales = 112000.0;

    let top_sellers = [
      { name = "Greek Salad"; units_sold = 320; revenue = 4800.0 },
      { name = "Caesar Bowl"; units_sold = 275; revenue = 4125.0 },
      { name = "Quinoa Power"; units_sold = 195; revenue = 2925.0 },
      { name = "Super Greens"; units_sold = 150; revenue = 2250.0 },
      { name = "Fruit Mix"; units_sold = 95; revenue = 1425.0 },
    ];

    let recent_transactions = [
      { id = 1; item = "Greek Salad"; amount = 15.0; time = "2024-03-29T10:15:00Z" },
      { id = 2; item = "Caesar Bowl"; amount = 15.0; time = "2024-03-29T10:05:00Z" },
      { id = 3; item = "Quinoa Power"; amount = 15.0; time = "2024-03-29T09:55:00Z" },
      { id = 4; item = "Super Greens"; amount = 15.0; time = "2024-03-29T09:45:00Z" },
      { id = 5; item = "Fruit Mix"; amount = 15.0; time = "2024-03-29T09:35:00Z" },
    ];

    {
      daily_sales;
      weekly_sales;
      monthly_sales;
      total_revenue = monthly_sales;
      total_profit = 34500.0;
      top_sellers;
      recent_transactions;
    };
  };
};
