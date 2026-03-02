module {
  type OldActor = {
    // For compatibility, even if actor is empty!
  };

  type NewActor = {
    // For compatibility, even if actor is empty!
  };

  public func run(old : OldActor) : NewActor {
    // Simple migration without changes to state
    {};
  };
};
