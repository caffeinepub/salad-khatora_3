import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Debug "mo:core/Debug";

actor {
  // State Initialization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type IngredientId = Nat;
  type NotificationId = Nat;
  type MenuItemId = Nat;
  type SaleId = Nat;

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

  public type ReportStats = {
    total_revenue : Float;
    total_profit : Float;
    total_orders : Nat;
    total_units : Nat;
    avg_order_value : Float;
    daily_breakdown : [{
      date_label : Text;
      revenue : Float;
      profit : Float;
      orders : Nat;
    }];
    top_sellers : [{
      name : Text;
      units_sold : Nat;
      revenue : Float;
    }];
  };

  public type UserProfile = {
    name : Text;
  };

  public type IngredientUsage = {
    ingredientName : Text;
    quantity_used : Float;
  };

  public type MenuItem = {
    id : MenuItemId;
    name : Text;
    description : Text;
    selling_price : Float;
    cost_per_bowl : Float;
    ingredientUsage : [IngredientUsage];
    created_at : Int;
    updated_at : Int;
  };

  public type SaleRecord = {
    id : SaleId;
    menu_item_id : MenuItemId;
    menu_item_name : Text;
    quantity : Nat;
    unit_price : Float;
    total_amount : Float;
    cost_amount : Float;
    profit : Float;
    created_at : Int;
  };

  // Storage
  let ingredients = Map.empty<IngredientId, Ingredient>();
  let notifications = Map.empty<NotificationId, Notification>();
  let menuItems = Map.empty<MenuItemId, MenuItem>();
  let salesRecords = Map.empty<SaleId, SaleRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // ID Counters
  var nextIngredientId = 1;
  var nextNotificationId = 1;
  var nextMenuItemId = 1;
  var nextSaleId = 1;

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

  // Seed Ingredients
  public shared ({ caller }) func seedIngredients() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can seed ingredients");
    };

    let now = Time.now();

    // Ingredient ID starts at 1
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

      // Create low stock notification if needed
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
  public shared ({ caller }) func addIngredient(
    name : Text,
    quantity : Float,
    unit : Text,
    cost_price : Float,
    supplier : Text,
    threshold : Float,
  ) : async IngredientId {
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

  public shared ({ caller }) func updateIngredient(
    id : IngredientId,
    name : Text,
    quantity : Float,
    unit : Text,
    cost_price : Float,
    supplier : Text,
    threshold : Float,
  ) : async () {
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

  // Inventory Management
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

  // Menu Management
  public shared ({ caller }) func addMenuItem(
    name : Text,
    description : Text,
    selling_price : Float,
    cost_per_bowl : Float,
    ingredientUsage : [IngredientUsage],
  ) : async MenuItemId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can add menu items");
    };

    let menuItem : MenuItem = {
      id = nextMenuItemId;
      name;
      description;
      selling_price;
      cost_per_bowl;
      ingredientUsage;
      created_at = Time.now();
      updated_at = Time.now();
    };
    menuItems.add(nextMenuItemId, menuItem);
    let currentId = nextMenuItemId;
    nextMenuItemId += 1;
    currentId;
  };

  public shared ({ caller }) func updateMenuItem(
    id : MenuItemId,
    name : Text,
    description : Text,
    selling_price : Float,
    cost_per_bowl : Float,
    ingredientUsage : [IngredientUsage],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can update menu items");
    };

    switch (menuItems.get(id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?menuItem) {
        let updated : MenuItem = {
          menuItem with
          name;
          description;
          selling_price;
          cost_per_bowl;
          ingredientUsage;
          updated_at = Time.now();
        };
        menuItems.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteMenuItem(id : MenuItemId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can delete menu items");
    };

    if (not menuItems.containsKey(id)) {
      Runtime.trap("Menu item not found");
    };
    menuItems.remove(id);
  };

  public query ({ caller }) func getMenuItems() : async [MenuItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view menu items");
    };
    menuItems.values().toArray();
  };

  public query ({ caller }) func getMenuItem(id : MenuItemId) : async MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view menu items");
    };
    switch (menuItems.get(id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?menuItem) { menuItem };
    };
  };

  // Seed Menu Items
  public shared ({ caller }) func seedMenuItems() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can seed menu items");
    };

    let now = Time.now();

    // Ingredient IDs start at 1
    let menuSeedData : [(Text, Text, Float, Float, [IngredientUsage])] = [
      (
        "Greek Salad",
        "Fresh salad with feta, olives, tomatoes, cucumbers",
        15.0,
        12.5,
        [
          { ingredientName = "Lettuce"; quantity_used = 100.0 }, { ingredientName = "Tomatoes"; quantity_used = 80.0 }, { ingredientName = "Cucumbers"; quantity_used = 60.0 }, { ingredientName = "Cheese"; quantity_used = 40.0 }, { ingredientName = "Olive Oil"; quantity_used = 10.0 },
        ],
      ),
      (
        "Caesar Bowl",
        "Romaine lettuce, cheese, croutons, caesar dressing",
        15.0,
        11.0,
        [
          { ingredientName = "Lettuce"; quantity_used = 120.0 }, { ingredientName = "Cheese"; quantity_used = 50.0 }, { ingredientName = "Croutons"; quantity_used = 30.0 }, { ingredientName = "Caesar Dressing"; quantity_used = 20.0 },
        ],
      ),
      (
        "Quinoa Power",
        "Quinoa, mixed greens, tomatoes, red onion",
        15.0,
        10.5,
        [
          { ingredientName = "Lettuce"; quantity_used = 80.0 }, { ingredientName = "Tomatoes"; quantity_used = 60.0 }, { ingredientName = "Red Onion"; quantity_used = 40.0 },
        ],
      ),
      (
        "Super Greens",
        "Lettuce, bell peppers, cucumber, carrots",
        15.0,
        9.5,
        [
          { ingredientName = "Lettuce"; quantity_used = 110.0 }, { ingredientName = "Bell Peppers"; quantity_used = 70.0 }, { ingredientName = "Cucumbers"; quantity_used = 50.0 }, { ingredientName = "Carrots"; quantity_used = 30.0 },
        ],
      ),
      (
        "Fruit Mix",
        "Fresh fruits salad with lettuce base",
        15.0,
        8.5,
        [
          { ingredientName = "Lettuce"; quantity_used = 90.0 },
        ],
      ),
    ];

    for ((name, description, selling_price, cost_per_bowl, ingredientUsage) in menuSeedData.values()) {
      let menuItem : MenuItem = {
        id = nextMenuItemId;
        name;
        description;
        selling_price;
        cost_per_bowl;
        ingredientUsage;
        created_at = now;
        updated_at = now;
      };
      menuItems.add(nextMenuItemId, menuItem);
      nextMenuItemId += 1;
    };
  };

  // Sales Management
  public shared ({ caller }) func recordSale(menu_item_id : MenuItemId, quantity : Nat) : async SaleId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record sales");
    };

    if (quantity == 0) {
      Runtime.trap("Quantity must be greater than zero");
    };
    let menuItem = switch (menuItems.get(menu_item_id)) {
      case (null) { Runtime.trap("Menu item not found") };
      case (?item) { item };
    };
    let total_amount = menuItem.selling_price * quantity.toFloat();
    let cost_amount = menuItem.cost_per_bowl * quantity.toFloat();
    let profit = total_amount - cost_amount;

    let saleRecord : SaleRecord = {
      id = nextSaleId;
      menu_item_id;
      menu_item_name = menuItem.name;
      quantity;
      unit_price = menuItem.selling_price;
      total_amount;
      cost_amount;
      profit;
      created_at = Time.now();
    };

    salesRecords.add(nextSaleId, saleRecord);
    let currentId = nextSaleId;
    nextSaleId += 1;
    currentId;
  };

  public query ({ caller }) func getSales() : async [SaleRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sales");
    };
    salesRecords.values().toArray().reverse();
  };

  public query ({ caller }) func getSaleById(id : SaleId) : async SaleRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sales");
    };
    switch (salesRecords.get(id)) {
      case (null) { Runtime.trap("Sale record not found") };
      case (?record) { record };
    };
  };

  public shared ({ caller }) func deleteSale(id : SaleId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can delete sales records");
    };
    if (not salesRecords.containsKey(id)) {
      Runtime.trap("Sale record not found");
    };
    salesRecords.remove(id);
  };

  // Updated Dashboard Stats
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dashboard stats");
    };

    let now = Time.now();

    var daily_sales = 0.0;
    var weekly_sales = 0.0;
    var monthly_sales = 0.0;
    var total_revenue = 0.0;
    var total_profit = 0.0;

    let seconds_in_day = 86_400_000_000_000;
    let seconds_in_week = 604_800_000_000_000;
    let seconds_in_month = 2_592_000_000_000_000;

    let unit_count = Map.empty<Text, Nat>();
    let revenue_map = Map.empty<Text, Float>();

    let salesIter = salesRecords.values();
    salesIter.forEach(
      func(sale) {
        let age = now - sale.created_at;

        if (age <= seconds_in_day) {
          daily_sales += sale.total_amount;
        };
        if (age <= seconds_in_week) {
          weekly_sales += sale.total_amount;
        };
        if (age <= seconds_in_month) {
          monthly_sales += sale.total_amount;
        };

        total_revenue += sale.total_amount;
        total_profit += sale.profit;

        let current_units = switch (unit_count.get(sale.menu_item_name)) {
          case (null) { 0 };
          case (?units) { units };
        };
        unit_count.add(sale.menu_item_name, current_units + sale.quantity);

        let current_revenue = switch (revenue_map.get(sale.menu_item_name)) {
          case (null) { 0.0 };
          case (?rev) { rev };
        };
        revenue_map.add(sale.menu_item_name, current_revenue + sale.total_amount);
      }
    );

    let sortableItems = List.empty<{ name : Text; units_sold : Nat; revenue : Float }>();

    let unitEntries = unit_count.entries();

    for ((name, units_sold) in unitEntries) {
      let revenue = switch (revenue_map.get(name)) {
        case (null) { 0.0 };
        case (?amount) { amount };
      };
      sortableItems.add({
        name;
        units_sold;
        revenue;
      });
    };

    let sortableArray = sortableItems.toArray();
    let sorted = sortableArray.sort(
      func(a, b) {
        Nat.compare(b.units_sold, a.units_sold);
      }
    );
    let count = Nat.min(5, sorted.size());
    let top_sellers = sorted.sliceToArray(0, count);

    let recent_transactions = salesRecords.values().toArray().reverse().sliceToArray(0, Nat.min(10, salesRecords.size()));

    {
      daily_sales;
      weekly_sales;
      monthly_sales;
      total_revenue;
      total_profit;
      top_sellers;
      recent_transactions = recent_transactions.map(
        func(record) {
          {
            id = record.id;
            item = record.menu_item_name;
            amount = record.total_amount;
            time = record.created_at.toText();
          };
        }
      );
    };
  };

  // New Phase 5 Reports Functionality

  func compareSalesByCreatedAt(a : SaleRecord, b : SaleRecord) : Order.Order {
    Int.compare(b.created_at, a.created_at);
  };

  func compareDailyBreakdownByDate(
    a : { date_label : Text; revenue : Float; profit : Float; orders : Nat },
    b : { date_label : Text; revenue : Float; profit : Float; orders : Nat },
  ) : Order.Order {
    Text.compare(a.date_label, b.date_label);
  };

  public query ({ caller }) func getSalesByDateRange(from : Int, to : Int) : async [SaleRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };
    let filtered = salesRecords.values().toArray().filter(
      func(sale) {
        sale.created_at >= from and sale.created_at <= to
      }
    );
    filtered.sort(
      compareSalesByCreatedAt
    );
  };

  public query ({ caller }) func getReportStats(from : Int, to : Int) : async ReportStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view reports");
    };

    let seconds_in_day = 86_400_000_000_000;
    let day_buckets = Map.empty<Nat, List.List<SaleRecord>>();
    let unit_count = Map.empty<Text, Nat>();
    let revenue_map = Map.empty<Text, Float>();

    var total_quantity = 0;
    var total_orders = 0;
    var total_revenue = 0.0;
    var total_profit = 0.0;

    salesRecords.values().toArray().forEach(
      func(sale) {
        if (sale.created_at >= from and sale.created_at <= to) {
          total_orders += 1;
          total_quantity += sale.quantity;
          total_revenue += sale.total_amount;
          total_profit += sale.profit;

          // Day bucketing
          let day_index = Int.abs(sale.created_at) / seconds_in_day;

          let current_day_sales = switch (day_buckets.get(day_index)) {
            case (null) { List.empty<SaleRecord>() };
            case (?sales) { sales };
          };
          current_day_sales.add(sale);
          day_buckets.add(day_index, current_day_sales);

          // Top sellers
          let current_units = switch (unit_count.get(sale.menu_item_name)) {
            case (null) { 0 };
            case (?units) { units };
          };
          unit_count.add(sale.menu_item_name, current_units + sale.quantity);

          let current_revenue = switch (revenue_map.get(sale.menu_item_name)) {
            case (null) { 0.0 };
            case (?rev) { rev };
          };
          revenue_map.add(sale.menu_item_name, current_revenue + sale.total_amount);
        };
      }
    );

    // Process daily breakdown
    let daysIter = day_buckets.entries();
    let dailyEntries = List.empty<{ date_label : Text; revenue : Float; profit : Float; orders : Nat }>();

    daysIter.forEach(
      func((day, sales)) {
        let day_list : [SaleRecord] = sales.toArray();
        let first_sale = if (day_list.size() > 0) {
          day_list[0];
        } else {
          {
            id = 0;
            menu_item_id = 0;
            menu_item_name = "Invalid";
            quantity = 0;
            unit_price = 0.0;
            total_amount = 0.0;
            cost_amount = 0.0;
            profit = 0.0;
            created_at = 0;
          };
        };

        let date_label = first_sale.created_at.toText();
        var day_revenue = 0.0;
        var day_profit = 0.0;

        sales.toArray().forEach(
          func(sale) {
            day_revenue += sale.total_amount;
            day_profit += sale.profit;
          }
        );

        dailyEntries.add({
          date_label;
          revenue = day_revenue;
          profit = day_profit;
          orders = sales.size();
        });
      }
    );

    let daily_breakdown = dailyEntries.toArray().sort(
      compareDailyBreakdownByDate
    );

    let sortableItems = List.empty<{ name : Text; units_sold : Nat; revenue : Float }>();

    let unitEntries = unit_count.entries();

    unitEntries.forEach(
      func((name, units_sold)) {
        let revenue = switch (revenue_map.get(name)) {
          case (null) { 0.0 };
          case (?amount) { amount };
        };
        sortableItems.add({
          name;
          units_sold;
          revenue;
        });
      }
    );

    let sortableArray = sortableItems.toArray();
    let sorted = sortableArray.sort(
      func(a, b) {
        Nat.compare(b.units_sold, a.units_sold);
      }
    );
    let count = Nat.min(5, sorted.size());
    let top_sellers = sorted.sliceToArray(0, count);

    {
      total_revenue;
      total_profit;
      total_orders;
      total_units = total_quantity;
      avg_order_value = if (total_orders > 0) {
        total_revenue / total_orders.toFloat();
      } else {
        0.0;
      };
      daily_breakdown;
      top_sellers;
    };
  };
};
