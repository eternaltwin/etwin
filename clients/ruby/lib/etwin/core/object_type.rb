# typed: strict
# frozen_string_literal: true

module Etwin
  module Core
    # Object type enum
    class ObjectType < T::Enum
      extend T::Sig

      enums do
        ClientForumActor = new('ClientForumActor')
        ForumPost = new('ForumPost')
        ForumPostRevision = new('ForumPostRevision')
        ForumSection = new('ForumSection')
        ForumThread = new('ForumThread')
        HammerfestUser = new('HammerfestUser')
        OauthClient = new('OauthClient')
        RoleForumActor = new('RoleForumActor')
        TwinoidUser = new('TwinoidUser')
        User = new('User')
        UserForumActor = new('UserForumActor')
      end

      sig { returns(String) }
      def to_s
        T.cast(serialize, String)
      end

      sig { returns(String) }
      def inspect
        "ObjectType(#{self})"
      end
    end
  end
end
