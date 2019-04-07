const yaml = require('yaml');
const fs   = require('fs');
const _    = require('lodash');

class AclController {

  constructor() {
    this.roles = {};
  }


  init() {
    const roleFile = fs.readFileSync('./roles.yaml').toString();
    this.roles     = yaml.parse(roleFile);
    Object.keys(this.roles).reduce((acc, role) => ({
      [role]: this.getRolePermissions(role),
    }), {});
  }

  /**
   * @private
   */
  getRolePermissions(role) {
    const roleValue                 = _.get(this.roles, role);
    const { permissions, inherits } = roleValue;

    // ensure permissions only get computed once
    if (roleValue.inherits) {
      roleValue.permissions = [
        ...permissions,
        ...inherits.reduce((acc, inheritedRole) => ([ ...acc, ...this.getRolePermissions(inheritedRole) ]), [])
      ];
      delete roleValue.inherits;
    }

    return roleValue.permissions;
  }


  isAllowed(permission) {
    return (req, res, next) => {
      const userRole      = _.get(req.context, 'user.role', 'anonymous');
      const isRoleAllowed = _.includes(
        _.get(this.roles, [userRole, 'permissions']),
        permission,
      );

      if (isRoleAllowed) {
        return next();
      }

      return res
      .status(401)
      .json({ message: 'not authorized', status: 401 });
    }
  }

}

const acl = new AclController();
acl.init();


module.exports = acl;