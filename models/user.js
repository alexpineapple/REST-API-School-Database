'use strict';
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {}
  User.init({
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'A first name is required'
        },
        notEmpty: {
          msg: 'Please provide a name'
        }
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'A last name is required'
        },
        notEmpty: {
          msg: 'Please provide a name'
        }
      }
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'The email you entered already exists'
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        },
        notNull: {
          msg: 'An email is required'
        },
        notEmpty: {
          msg: 'Please provide an email'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A password is required",
        },
        notEmpty: {
          msg: "Please provide a password",
        },
      },
      set(val) {
        const hashedPassword = bcrypt.hashSync(val, 10);
        this.setDataValue("password", hashedPassword);
      },
    }
  }, { sequelize, modelName: 'User' });

  User.associate = (models) => {
    User.hasMany(models.Course, {
        as: 'user',
        foreignKey: {
            fieldName: 'userId',
            allowNull: false,
        },
    });
  };

  return User;
};