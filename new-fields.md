We have a simplified and immediate version implemented instead of the full-blown weight composing feature, which will appear in the future.

First move is localizing how recipients are handled to each scope. Instead of having a shared recipient field in the root contract, this change moves the field to within the scopes. Curator and Namespace permissions retain all the current behavior.

For Stream (Emission → Stream) permissions, the change is bigger. Instead of having a single recipient, the new version bridges the gap between what the targets and recipient did. The list of targets became the new recipients, and the old recipient field was dropped. This way, the recipients are the entities that actually receive the streamed tokens.

pub struct PermissionContract {
pub delegator: AccountId,

- pub recipient: AccountId,
  pub scope: PermissionScope,

* pub last_update: Block,
  // ... other fields
  }
  pub struct StreamScope {
* pub recipients: Map<AccountId, u16>,
  pub allocation: EmissionAllocation,
  pub distribution: DistributionControl,

- pub targets: Map<AccountId, u16>,
  pub accumulating: bool,

* pub recipient_managers: Set<AccountId>,
* pub weight_setters: Set<AccountId>,
  }

To solve the main issue described by this project, two new fields were added: recipient_managers and weight_setters. They allow the delegator to define accounts (for now only a single account for each field) on delegation (or when updating the permission afterwards) capable of updating the set of recipients or altering the weights, only when the permission is already revokable. The extrinsic through each this update is done is update_stream_permission:

pub fn update_stream_permission(
origin: Origin,
permission_id: PermissionId,
new_recipients: Option<Map<AccountId, u16>>,
new_streams: Option<Map<StreamId, Percent>>,
new_distribution_control: Option<DistributionControl>,
new_recipient_manager: Option<Option<AccountId>>,
new_weight_setter: Option<Option<AccountId>>,
)

The delegator can either define new managers and setters or clear them (Some(None)), just None means not updating that field). Recipient managers are allowed to call this extrinsic with a new_recipients map, with at least one key, while weight setters must provide a new_recipients map with the same current recipient keys and is only allowed to alter the weights.

While delegating the permission, the user can also specify the manager keys:

pub fn delegate_stream_permission(
origin: OriginFor<T>,
recipients: BoundedBTreeMap<T::AccountId, u16, T::MaxRecipientsPerPermission>,
allocation: StreamAllocation<T>,
distribution: DistributionControl<T>,
duration: PermissionDuration<T>,
revocation: RevocationTerms<T>,
enforcement: EnforcementAuthority<T>,
recipient_manager: Option<T::AccountId>,
weight_setter: Option<T::AccountId>,
)
