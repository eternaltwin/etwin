# typed: strict
# frozen_string_literal: true

module Etwin
  module User
    # Main user class
    class User
      extend T::Helpers
      extend T::Sig

      final!

      sig(:final) { returns(UserId) }
      attr_reader :id

      sig(:final) { returns(UserDisplayNameVersions) }
      attr_reader :display_name

      sig(:final) { returns(T::Boolean) }
      attr_reader :is_administrator

      sig(:final) { returns(Etwin::Link::VersionedLinks) }
      attr_reader :links

      sig(:final) do
        params(
          id: UserId,
          display_name: UserDisplayNameVersions,
          is_administrator: T::Boolean,
          links: Etwin::Link::VersionedLinks
        ).void
      end
      def initialize(id, display_name, is_administrator, links)
        @id = T.let(id, UserId)
        @display_name = T.let(display_name, UserDisplayNameVersions)
        @is_administrator = T.let(is_administrator, T::Boolean)
        @links = T.let(links, Etwin::Link::VersionedLinks)
        freeze
      end

      sig(:final) { params(other: BasicObject).returns(T::Boolean) }
      def ==(other)
        case other
        when User
          @id == other.id &&
            @display_name == other.display_name &&
            @is_administrator == other.is_administrator &&
            @links == other.links
        else
          false
        end
      end

      sig(:final) { returns(Integer) }
      def hash
        [@id, @display_name, @is_administrator, @links].hash
      end

      # https://github.com/sorbet/sorbet/blob/master/rbi/stdlib/json.rbi#L194
      sig(:final) { params(opts: T.untyped).returns(String) }
      def to_json(opts = nil)
        JSON.generate(as_json, opts)
      end

      sig(:final) { returns(T::Hash[String, T.untyped]) }
      def as_json
        {
          'id' => @id.as_json,
          'display_name' => @display_name.as_json,
          'is_administrator' => @is_administrator,
          'links' => @links.as_json
        }
      end

      sig(:final) { returns(String) }
      def inspect
        PP.singleline_pp(self, String.new)
      end

      sig(:final) { params(pp: T.untyped).returns(T.untyped) }
      def pretty_print(pp)  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
        pp.group(0, "#{self.class.name}(", ')') do
          pp.nest 1 do
            pp.breakable ''
            pp.text 'id='
            pp.pp @id
            pp.text ','
            pp.breakable ''
            pp.text 'display_name='
            pp.pp @display_name
            pp.text ','
            pp.breakable ''
            pp.text 'is_administrator='
            pp.pp @is_administrator
            pp.text ','
            pp.breakable ''
            pp.text 'links='
            pp.pp @links
          end
          pp.breakable ''
        end
      end

      class << self
        extend T::Sig

        sig(:final) { params(json_str: String).returns(T.attached_class) }
        def from_json(json_str)
          deserialize JSON.parse(json_str)
        end

        sig(:final) { params(raw: T.untyped).returns(T.attached_class) }
        def deserialize(raw)
          id = UserId.new(raw['id'])
          display_name = UserDisplayNameVersions.deserialize(raw['display_name'])
          is_administrator = raw['is_administrator']
          links = Etwin::Link::VersionedLinks.deserialize(raw['links'])
          new(id, display_name, is_administrator, links)
        end
      end
    end
  end
end
